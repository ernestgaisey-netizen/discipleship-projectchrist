<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Certificate of Completion</title>
    <style>
        body {
            font-family: 'Helvetica', sans-serif;
            text-align: center;
            border: 10px solid #787878;
            padding: 50px;
        }

        .header {
            font-size: 50px;
            font-weight: bold;
            color: #333;
            margin-bottom: 20px;
        }

        .subheader {
            font-size: 25px;
            color: #555;
            margin-bottom: 40px;
        }

        .recipient {
            font-size: 40px;
            font-weight: bold;
            color: #000;
            text-decoration: underline;
            margin-bottom: 20px;
        }

        .course {
            font-size: 30px;
            color: #333;
            margin-bottom: 30px;
        }

        .date {
            font-size: 20px;
            color: #666;
            margin-top: 50px;
        }

        .signature {
            margin-top: 50px;
            border-top: 2px solid #333;
            width: 300px;
            margin-left: auto;
            margin-right: auto;
            padding-top: 10px;
        }
    </style>
</head>

<body>
    <div class="header">Certificate of Completion</div>
    <div class="subheader">This is to certify that</div>
    <div class="recipient">{{ $user->name }}</div>
    <div class="subheader">Has successfully completed the course</div>
    <div class="course">{{ $course->title }}</div>
    <div class="date">Awarded on {{ $date }}</div>

    <div class="signature">
        Instructor / Administrator
    </div>
</body>

</html>