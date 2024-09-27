/* eslint-disable no-irregular-whitespace */
import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';
import config from '../config';

export type IMailData = {
  company_name?: string;
  title: string;
  receiver_email?: string;
  receivers_email?: string;
  subject: string;
  logo?: string;
  logo_to_link?: string;
  button?: {
    button_action_details: string;
    button_text: string;
    button_link: string;
    button_color_code: string;
  };
  dictionary?: {
    date: string;
    address: string;
  };
  body_text: string;
  footer_text?: string;
  data?: {
    otp: string | number;
    reset_link?: string;
    time_out: string | Date;
  };
};
export const sendMailHelper = async (bodyData: IMailData) => {
  const {
    company_name,
    title,
    receiver_email,
    receivers_email,
    subject,
    logo,
    logo_to_link,
    // copyright,
    button,
    dictionary,
    body_text,
    footer_text,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data,
  } = bodyData;
  //   function convertToSingleQuotes(inputString: string) {
  //     return "'" + inputString + "'";
  //   }
  //console.log(config.nodemailer.auth_user, config.nodemailer.auth_pass);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'sampodsubroto03@gmail.com',
      pass: 'ayumgkyaqhkflyza', // tvcz ozic inul fsek --> remove space-> tvczozicinulfsek
      //   user: convertToSingleQuotes(config.nodemailer.auth_user as string),
      //   pass: convertToSingleQuotes(config.nodemailer.auth_pass as string),
      // user: config.nodemailer.auth_user as string,
      // pass: config.nodemailer.auth_pass as string,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  // console.log("🚀 ~ sendMailHelper ~ transporter:", transporter)

  // ------------- mailGenerator-start-------------
  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      // Appears in header & footer of e-mails
      name: company_name || 'N/A',
      logo:
        logo ||
        config.logo ||
        'https://res.cloudinary.com/dqvhxpu11/image/upload/v1726571866/bnzf8epjafddqirzu8xa.jpg',
      link:
        logo_to_link ||
        (config.client_side_url as string) ||
        'https://res.cloudinary.com/dqvhxpu11/image/upload/v1726571866/bnzf8epjafddqirzu8xa.jpg',
      // Optional product logo
      logoHeight: '50px',
    },
    // copyright: copyright || 'Copyright © 2016 techrem. All rights reserved.',
  });

  // console.log("🚀 ~ sendMailHelper ~ mailGenerator:", mailGenerator)
  const emailBody = mailGenerator.generate({
    body: {
      title: title || 'Welcome to Renti',
      // name: 'Sing up successfull/ Booking successfull',

      intro:
        body_text ||
        'Your booking successful done , We are very excited,Hope you get the service you want',
      // To inject multiple lines of text for the intro or outro
      // intro: ['Welcome to Mailgen!', 'We\'re very excited to have you on board.'],
      action:
        button?.button_text &&
        ({
          instructions: button?.button_action_details || `Please click here`,
          button: {
            text: button?.button_text || 'Confirm your account',
            link: button?.button_link || config.client_side_url,
            color: button?.button_color_code || '#22BC66', // Optional action button color
          },
        } as any),

      dictionary: dictionary && {
        date: dictionary?.date,
        address: dictionary?.address,
      },
      outro:
        footer_text || `Need help, or have questions? Just reply to this email`,
    },
  });

  // ------------- mailGenerator-end-------------

  // to: data.receiver_Email,//single email
  /* multipal email to sand same email because this fild accept . to:'sampodnath@gmail.com,sampodnath76@gmail.com' 
    to: data.receivers_Email.toString(),
    */

  const returNTransport = await transporter.sendMail({
    from: config.nodemailer.auth_user,
    subject: subject,
    to: receiver_email || receivers_email?.toString(),
    html: emailBody,
  });

  return returNTransport;
};
