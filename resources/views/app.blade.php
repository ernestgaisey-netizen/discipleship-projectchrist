<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#0D1F35">

    <title>Project Christ Discipleship</title>
    <meta name="description" content="Project Christ Discipleship is a structured platform to help believers grow deeper in faith, community, and Kingdom service.">

    <!-- Open Graph -->
    <meta property="og:type"        content="website">
    <meta property="og:title"       content="Project Christ Discipleship">
    <meta property="og:description" content="Structured discipleship courses, exam-gated modules, community, and mentorship — Christ Our Message.">
    <meta property="og:image"       content="/images/project-christ-logo.png">
    <meta property="og:site_name"   content="Project Christ">

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/images/project-christ-logo.png">
    <link rel="apple-touch-icon"      href="/images/project-christ-logo.png">

    <!-- Canonical fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@400;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <!-- React app entry (Vite) -->
    @vite(['resources/js/main.jsx'])
</head>
<body>
    <div id="root"></div>
</body>
</html>
