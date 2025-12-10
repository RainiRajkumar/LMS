import smtplib  ##It is python's built in module for sending emails via smto servers
from email.mime.text import MIMEText  ##create a plain-text email content
from email.mime.multipart import MIMEMultipart ##create emails with mutiple parts

def send_enrollment_email(to_email: str, student_name: str, course_title: str):
    # Email credentials
    sender_email = "rajkumarraini369@gmail.com"
    sender_password = "pexi qdsx odog tfas"  # Consider using environment variable

    # Email content
    subject = f"Enrollment Confirmation for {course_title}"
    body = f"""
    Hi {student_name},

    Congratulations! You have successfully enrolled in the course: {course_title}.

    Thank you,
    Course Management Team
    """

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect to SMTP server (Gmail example)
        server = smtplib.SMTP('smtp.gmail.com', 587)    ## connects to gmail smtp server 
        server.starttls()  ##upgrade connection to an encrypted one
        server.login(sender_email, sender_password) ##login to email account
        server.send_message(msg)  ##sends the message
        server.quit() ## closes the smtp connection
        print(f"Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Error sending email: {e}")
