<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

// Database connection parameters
$host = 'localhost';
$db   = 'diemthi';
$user = 'diemthi';
$pass = 'tunganh2003';
$charset = 'utf8mb4';

// Connect to MySQL
$mysqli = new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to connect to database']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Router: Determine what action based on GET param 'action'
$action = $_GET['action'] ?? null;

switch ($method) {
    case 'GET':
        if ($action === 'comments' || $action === null) {
            getComments($mysqli);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Invalid GET action']);
        }
        break;

    case 'POST':
        if ($action === 'comments') {
            createComment($mysqli);
        } elseif ($action === 'like') {
            likeComment($mysqli);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Invalid POST action']);
        }
        break;
    case 'OPTIONS':
        // Handle preflight OPTIONS request
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Max-Age: 86400");
        http_response_code(200);
        exit;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method Not Allowed']);
        break;
}

$mysqli->close();

/**
 * Fetch all comments with replies nested and counts of likes
 */
function getComments($mysqli)
{
    // Get pagination parameters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $per_page = isset($_GET['per_page']) ? max(1, intval($_GET['per_page'])) : 5;
    $offset = ($page - 1) * $per_page;

    // Get both total counts
    $count_sql = "SELECT 
        (SELECT COUNT(*) FROM comments) as total_all,
        (SELECT COUNT(*) FROM comments WHERE parent_id IS NULL) as total_parents";
    $count_result = $mysqli->query($count_sql);
    $count_data = $count_result->fetch_assoc();
    $total_count = $count_data['total_all'];
    $total_parents = $count_data['total_parents'];

    // If page is beyond total pages, adjust it
    $total_pages = ceil($total_parents / $per_page);
    if ($page > $total_pages && $total_pages > 0) {
        $page = $total_pages;
        $offset = ($page - 1) * $per_page;
    }

    // Get all comments ordered by created_at
    $sql = "SELECT c.id, c.name, c.comment, c.parent_id, c.created_at,
                   (SELECT COUNT(*) FROM likes l WHERE l.comment_id = c.id) as likes_count
            FROM comments c 
            WHERE c.parent_id IS NULL
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?";

    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("ii", $per_page, $offset);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        http_response_code(500);
        echo json_encode(['error' => 'Error fetching comments']);
        return;
    }

    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $row['likes_count'] = (int)$row['likes_count'];
        $comments[] = $row;
    }

    // Get all replies for these parent comments
    if (!empty($comments)) {
        $parent_ids = array_column($comments, 'id');
        $placeholders = str_repeat('?,', count($parent_ids) - 1) . '?';

        // First get direct replies
        $replies_sql = "SELECT c.id, c.name, c.comment, c.parent_id, c.created_at,
                      (SELECT COUNT(*) FROM likes l WHERE l.comment_id = c.id) as likes_count
                      FROM comments c 
                      WHERE c.parent_id IN ($placeholders)
                      ORDER BY c.created_at DESC";

        $stmt = $mysqli->prepare($replies_sql);
        $types = str_repeat('i', count($parent_ids));
        $stmt->bind_param($types, ...$parent_ids);
        $stmt->execute();
        $replies_result = $stmt->get_result();

        $reply_ids = [];
        while ($row = $replies_result->fetch_assoc()) {
            $row['likes_count'] = (int)$row['likes_count'];
            $comments[] = $row;
            $reply_ids[] = $row['id'];
        }

        // Then get replies to replies if any exist
        if (!empty($reply_ids)) {
            $reply_placeholders = str_repeat('?,', count($reply_ids) - 1) . '?';
            $nested_replies_sql = "SELECT c.id, c.name, c.comment, c.parent_id, c.created_at,
                                (SELECT COUNT(*) FROM likes l WHERE l.comment_id = c.id) as likes_count
                                FROM comments c 
                                WHERE c.parent_id IN ($reply_placeholders)
                                ORDER BY c.created_at DESC";

            $stmt = $mysqli->prepare($nested_replies_sql);
            $types = str_repeat('i', count($reply_ids));
            $stmt->bind_param($types, ...$reply_ids);
            $stmt->execute();
            $nested_replies_result = $stmt->get_result();

            while ($row = $nested_replies_result->fetch_assoc()) {
                $row['likes_count'] = (int)$row['likes_count'];
                $comments[] = $row;
            }
        }
    }

    // Nest replies under their parents (build tree)
    $commentTree = buildTree($comments);

    echo json_encode([
        'results' => $commentTree,
        'total' => $total_count,
        'total_parents' => $total_parents,
        'page' => $page,
        'per_page' => $per_page,
        'total_pages' => $total_pages
    ]);
}

/**
 * Build nested tree of comments and replies
 */
function buildTree(array $elements, $parentId = null)
{
    $branch = [];

    foreach ($elements as $element) {
        if ($element['parent_id'] == $parentId) {
            $children = buildTree($elements, $element['id']);
            if ($children) {
                $element['replies'] = $children;
            } else {
                $element['replies'] = [];
            }
            $branch[] = $element;
        }
    }

    return $branch;
}

/**
 * Handle creating a new comment or reply
 * Accepts POST JSON input:
 * {
 *  "name": "string",
 *  "comment": "string",
 *  "parent_id": optional int (for replies)
 * }
 */
function createComment($mysqli)
{
    $input = json_decode(file_get_contents('php://input'), true);

    // Validate input
    if (!isset($input['name']) || !isset($input['comment']) || !isset($input['recaptcha_response'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters: name, comment, and reCAPTCHA response']);
        return;
    }

    // Verify reCAPTCHA
    $recaptcha_secret = '6LdWZ14rAAAAACpkz8Dox7Nu8DonETe9xIDjfr85';
    $verify_url = 'https://www.google.com/recaptcha/api/siteverify';
    $data = [
        'secret' => $recaptcha_secret,
        'response' => $input['recaptcha_response']
    ];

    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];

    $context = stream_context_create($options);
    $verify_response = file_get_contents($verify_url, false, $context);
    $response_data = json_decode($verify_response);

    if (!$response_data->success) {
        http_response_code(400);
        echo json_encode(['error' => 'reCAPTCHA verification failed']);
        return;
    }

    $name = trim($input['name']);
    $comment = trim($input['comment']);
    $parent_id = isset($input['parent_id']) ? intval($input['parent_id']) : null;

    if ($name === '' || $comment === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Name and comment cannot be empty']);
        return;
    }

    // Optional: verify parent_id exists if provided
    if ($parent_id !== null) {
        $stmt = $mysqli->prepare("SELECT id FROM comments WHERE id = ?");
        $stmt->bind_param("i", $parent_id);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows === 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid parent_id, comment to reply does not exist']);
            $stmt->close();
            return;
        }
        $stmt->close();
    }

    // Insert comment
    $stmt = $mysqli->prepare("INSERT INTO comments (name, comment, parent_id) VALUES (?, ?, ?)");
    if ($parent_id === null) {
        $stmt->bind_param("ssi", $name, $comment, $parent_id); // pass NULL for parent_id
    } else {
        $stmt->bind_param("ssi", $name, $comment, $parent_id);
    }

    if ($stmt->execute()) {
        $new_id = $stmt->insert_id;
        echo json_encode(['success' => true, 'comment_id' => $new_id]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to insert comment']);
    }

    $stmt->close();
}

/**
 * Handle liking a comment or reply.
 * Accept POST JSON input:
 * {
 *    "comment_id": int
 * }
 */
function likeComment($mysqli)
{
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['comment_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing comment_id parameter']);
        return;
    }

    $comment_id = intval($input['comment_id']);
    if ($comment_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid comment_id']);
        return;
    }

    // Check if comment exists
    $stmt = $mysqli->prepare("SELECT id FROM comments WHERE id = ?");
    $stmt->bind_param("i", $comment_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Comment not found']);
        $stmt->close();
        return;
    }
    $stmt->close();

    // Insert like - no user tracking, multiple likes possible
    $stmt = $mysqli->prepare("INSERT INTO likes (comment_id) VALUES (?)");
    $stmt->bind_param("i", $comment_id);
    if ($stmt->execute()) {
        // Return new likes count
        $stmt->close();
        $stmtCount = $mysqli->prepare("SELECT COUNT(*) as likes_count FROM likes WHERE comment_id = ?");
        $stmtCount->bind_param("i", $comment_id);
        $stmtCount->execute();
        $res = $stmtCount->get_result()->fetch_assoc();
        $stmtCount->close();

        echo json_encode(['success' => true, 'likes_count' => (int)$res['likes_count']]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to like comment']);
        $stmt->close();
    }
}
