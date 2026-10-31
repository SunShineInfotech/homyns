<?php
function send_otp_email($to_email, $otp, $company_name) {
    $subject = "Your OTP for " . $company_name;
    $year    = date('Y');

    // Split OTP into individual digits for the box display
    $otp_str    = str_pad((string)$otp, 6, '0', STR_PAD_LEFT);
    $otp_digits = '';
    for ($i = 0; $i < strlen($otp_str); $i++) {
        $otp_digits .= '
            <span style="
                display:inline-block;
                width:44px;height:52px;
                border-radius:10px;
                background:#ffffff;
                border:1.5px solid #c7c3f4;
                font-size:26px;font-weight:600;
                color:#4f46e5;
                line-height:52px;
                text-align:center;
                font-family:\'Courier New\',monospace;
                margin:0 4px;
            ">' . htmlspecialchars($otp_str[$i]) . '</span>';
    }

    $html_message = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification – ' . htmlspecialchars($company_name) . '</title>
    <!--[if mso]>
    <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
    <![endif]-->
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Arial, sans-serif;
            background-color: #f1f5f9;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper { padding: 32px 16px; }
        .label {
            text-align: center;
            font-size: 11px;
            letter-spacing: 0.08em;
            color: #94a3b8;
            text-transform: uppercase;
            margin-bottom: 14px;
        }
        .card {
            max-width: 560px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }

        /* Header */
        .card-header {
            background: #4f46e5;
            padding: 28px 36px;
        }
        .header-inner {
            display: flex;
            align-items: center;
            gap: 14px;
        }
        .header-icon {
            width: 44px; height: 44px;
            border-radius: 10px;
            background: rgba(255,255,255,0.15);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px;
        }
        .header-company { color: #ffffff; font-size: 18px; font-weight: 600; }
        .header-sub { color: rgba(255,255,255,0.65); font-size: 12px; margin-top: 2px; }

        /* Body */
        .card-body { padding: 32px 36px; }
        .title { font-size: 20px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .intro { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 28px; }
        .intro strong { color: #1e293b; font-weight: 600; }

        /* OTP box */
        .otp-wrap {
            border: 1.5px dashed #6366f1;
            border-radius: 14px;
            padding: 24px 20px;
            text-align: center;
            background: #f8f7ff;
            margin-bottom: 24px;
        }
        .otp-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #6366f1;
            text-transform: uppercase;
            margin-bottom: 16px;
        }
        .otp-digits { display: inline-block; }
        .otp-expiry {
            margin-top: 14px;
            font-size: 12px;
            color: #94a3b8;
        }

        /* Security notice */
        .notice {
            background: #f8fafc;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            padding: 14px 16px;
            font-size: 13px;
            color: #64748b;
            line-height: 1.65;
            margin-bottom: 24px;
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }
        .notice-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .sign-off { font-size: 14px; color: #475569; line-height: 1.7; }
        .sign-off strong { color: #1e293b; font-weight: 600; }

        /* Footer */
        .card-footer {
            border-top: 1px solid #f1f5f9;
            padding: 16px 36px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #fafbff;
        }
        .footer-text { font-size: 12px; color: #94a3b8; }
        .footer-link { color: #6366f1; text-decoration: none; font-weight: 500; }

        /* Responsive */
        @media only screen and (max-width: 600px) {
            .card-body  { padding: 24px 20px; }
            .card-header { padding: 22px 20px; }
            .card-footer { padding: 14px 20px; flex-direction: column; gap: 6px; text-align: center; }
        }
    </style>
</head>
<body>
<div class="wrapper">
    <p class="label">Email Preview</p>
    <div class="card">

        <!-- Header -->
        <div class="card-header">
            <div class="header-inner">
                <div class="header-icon">🏢</div>
                <div>
                    <div class="header-company">' . htmlspecialchars($company_name) . '</div>
                    <div class="header-sub">Account verification</div>
                </div>
            </div>
        </div>

        <!-- Body -->
        <div class="card-body">
            <p class="title">Verify your identity</p>
            <p class="intro">
                Hello!<br>
                Use the one-time password below to complete your login to
                <strong>' . htmlspecialchars($company_name) . '</strong>.
                It expires in <strong>10 minutes</strong>.
            </p>

            <!-- OTP -->
            <div class="otp-wrap">
                <p class="otp-eyebrow">One-Time Password</p>
                <div class="otp-digits">' . $otp_digits . '</div>
                <p class="otp-expiry">⏱ Expires in 10 minutes</p>
            </div>

            <!-- Security notice -->
            <div class="notice">
                <span class="notice-icon">🛡️</span>
                <span>
                    If you did not request this code, you can safely ignore this email.
                    Someone may have entered your email address by mistake.
                    Never share this OTP with anyone.
                </span>
            </div>

            <p class="sign-off">
                Thank you,<br>
                <strong>' . htmlspecialchars($company_name) . ' Team</strong>
            </p>
        </div>

        <!-- Footer -->
        <div class="card-footer">
            <span class="footer-text">&copy; ' . $year . ' ' . htmlspecialchars($company_name) . '. All rights reserved.</span>
            <span class="footer-text">Powered by <a class="footer-link" href="https://www.sunshineinfotech.in/" target="_blank">Sunshine Infotech</a></span>
        </div>

    </div>
</div>
</body>
</html>';

    return send_new_registaion($to_email, $subject, $html_message);
}
function send_new_registaion($to_email, $subject, $html_message) 
{
    $alt_message = '';
    
    require __DIR__ . '/../PHPMailer_new/src/PHPMailer.php';
    require __DIR__ . '/../PHPMailer_new/src/SMTP.php';
    require __DIR__ . '/../PHPMailer_new/src/Exception.php';

    $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
    
    $alt_message = '';
    // $mail = new PHPMailer(true);
    
    $mail->isSMTP();
    $mail->Host = 'smtp.hostinger.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'noreplay@sunshineproduct.in';
    $mail->Password = 'SZTW6M:0y';
    $mail->SMTPSecure = 'ssl'; 
    $mail->Port = 465;

    $mail->setFrom('noreplay@sunshineproduct.in', 'Track Desk Powered by Sunshine Infotech');
    $mail->addAddress($to_email);

    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $html_message;
    $mail->AltBody = $alt_message ?: strip_tags($html_message);
    
    return $mail->send();
}
?>