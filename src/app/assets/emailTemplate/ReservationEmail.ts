import moment from 'moment';

export default function ReservationEmail({
  rent,
  offerRent,
  from,
  to,
  carModel,
}: {
  rent: number;
  offerRent: number;
  from: string | Date;
  to: string | Date;
  carModel: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pending Rent Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 5px;
            padding: 0;
            
        }
        .container {
            width: 80%;
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 10px 0;
        }
        .header img {
            max-width: 100px;
        }
        .content {
            margin-top: 20px;
        }
        .content h2 {
            color: #555;
        }
        .details {
            margin: 20px 0;
        }
        .details p {
            line-height: 1.6;
        }
        .details strong {
            color: #333;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding: 10px 0;
            border-top: 1px solid #ddd;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://yourlogo.com/logo.png" alt="Company Logo">
            <h1>Rent Request is Pending</h1>
        </div>
        <div class="content">
            <h2>Rent Details</h2>
            <div class="details">
                <p><strong>Car Model:</strong> ${carModel}</p>
                <p><strong>Price:</strong> ${offerRent} (Original Price: ${rent})</p>
            
                <p><strong>From:</strong> ${moment(from).format('YYYY MMM DD h:mm')}</p>
                <p><strong>To:</strong> ${moment(to).format('YYYY MMM DD h:mm')}</p>
            </div>
            <h2>Car Image</h2>
           
        </div>
        <div class="footer">
            <p>Thank you for choosing our service. We will notify you once your reservation is confirmed.</p>
            <p>&copy; 2024 Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;
}
