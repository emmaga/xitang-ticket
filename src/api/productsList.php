<?php
$page = $_GET['page'];
switch ($page) {
  case '1':
    echo '
      [
        {"name": "Moroni", "id": 1},
        {"name": "Moroni", "id": 2},
        {"name": "Emma", "id": 3},
        {"name": "Moroni", "id": 4},
        {"name": "Moroni", "id": 5}
      ]
    ';
    break;
  case '2':
    echo '
      [
        {"name": "Moroni", "id": 6},
        {"name": "Moroni", "id": 7},
        {"name": "Emma", "id": 8}
      ]
    ';
    break;
  default:
    # code...
    break;
}
?>