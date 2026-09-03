<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'DejaVu Serif', serif; background: #fff; color: #1a1a2e; width: 800px; }
  .cert { padding: 60px; border: 8px solid #1B4F8A; min-height: 560px; position: relative; }
  .cert::after {
    content: '';
    position: absolute; inset: 14px;
    border: 2px solid #2D7DD2;
    pointer-events: none;
  }
  .logo-row { text-align: center; margin-bottom: 20px; }
  .logo-img  { height: 72px; width: auto; }
  .logo-text {
    font-family: 'DejaVu Sans', sans-serif;
    font-size: 16px; font-weight: bold;
    color: #0D1F35; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px;
  }
  .logo-sub { font-size: 10px; color: #2D7DD2; letter-spacing: 4px; text-transform: uppercase; }
  .sig-img  { height: 44px; width: auto; display: block; margin: 0 auto 4px; }
  .divider { height: 2px; background: linear-gradient(90deg, transparent, #1B4F8A, transparent); margin: 18px 0; }
  .cert-title { text-align: center; font-size: 13px; color: #555; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; }
  .recipient { text-align: center; font-size: 36px; color: #0D1F35; margin: 12px 0; font-style: italic; }
  .body-text { text-align: center; font-size: 14px; color: #333; line-height: 1.8; margin: 10px 0; }
  .course-name { color: #1B4F8A; font-weight: bold; font-size: 18px; }
  .scripture { text-align: center; font-style: italic; color: #555; font-size: 12px; margin: 18px 0; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
  .sig-block { text-align: center; }
  .sig-line { border-top: 1px solid #1B4F8A; width: 180px; margin: 0 auto 6px; }
  .sig-label { font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
  .cert-code { text-align: center; font-size: 10px; color: #999; letter-spacing: 2px; }
  .issued-date { font-size: 12px; color: #666; }
  .badge-row { text-align: center; margin: 14px 0; }
  .badge-icon { font-size: 40px; }
</style>
</head>
<body>
<div class="cert">
  <div class="logo-row">
    <img class="logo-img" src="{{ public_path('images/project-christ-logo.png') }}" alt="Project Christ">
    <div class="logo-text">Project Christ Discipleship</div>
    <div class="logo-sub">Christ Our Message</div>
  </div>
  <div class="divider"></div>

  <div class="cert-title">Certificate of Completion</div>

  <p class="body-text">This is to certify that</p>
  <div class="recipient">{{ $user_name }}</div>
  <p class="body-text">
    has successfully completed the course<br>
    <span class="course-name">{{ $course_title }}</span><br>
    with all required modules and examinations passed.
  </p>

  <div class="badge-row"><span class="badge-icon">🏆</span></div>

  <div class="scripture">
    "Do your best to present yourself to God as one approved, a worker who does not need to be ashamed<br>
    and who correctly handles the word of truth." — 2 Timothy 2:15
  </div>

  <div class="divider"></div>

  <div class="footer">
    <div class="sig-block">
      @if(file_exists(public_path('images/signature.png')))
        <img class="sig-img" src="{{ public_path('images/signature.png') }}" alt="Signature">
      @endif
      <div class="sig-line"></div>
      <div class="sig-label">Ernest Gaisey — Executive Director</div>
      <div class="issued-date">Project Christ Discipleship</div>
    </div>
    <div class="cert-code">
      Certificate ID: {{ $certificate_code }}<br>
      Issued: {{ $issued_at }}<br><br>
      <span style="font-size:9px;">discipleship.projectchrist.org</span>
    </div>
    <div class="sig-block">
      <img class="logo-img" src="{{ public_path('images/project-christ-logo.png') }}" alt="Seal" style="height:56px;">
      <div class="sig-label" style="margin-top:4px;">Official Seal</div>
      <div class="issued-date">Christ Our Message</div>
    </div>
  </div>
</div>
</body>
</html>
