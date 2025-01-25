import dotenv from 'dotenv';
import path from 'path';
// cwd = current working directory (অর্থাৎ আমরা এখন যে পাইলে আছি এটা)
dotenv.config({ path: path.join(process.cwd(), '.env') }); // এখানে ২ টা জয়েন করে দিয়েছে

export default {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  socketPort: process.env.SOCKET_PORT,
  logo: process.env.LOGO_URL,
  projectName: process.env.PROJECT_NAME,
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    userName: process.env.REDIS_USER_NAME,
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
    queue: {
      host: process.env.REDIS_HOST_QUEUE,
      port: process.env.REDIS_PORT_QUEUE,
      userName: process.env.REDIS_USER_NAME_QUEUE,
      password: process.env.REDIS_PASSWORD_QUEUE,
      url: process.env.REDIS_URL_QUEUE,
    },
  },
  kafka: {
    url:
      process.env.NODE_ENV === 'development'
        ? process.env.KAFKA_URL_LOCAL
        : process.env.KAFKA_URL_PRODUCTION,
    clientId: process.env.KAFKA_CLIENT_ID,
  },
  serverMonitor: {
    lokiServer: process.env.LOKI_SERVER_URL_LOCAL,
  },

  fileSize: {
    image: Number(process.env.MAX_IMAGE_SIZE) || 1024,
    pdf: Number(process.env.MAX_PDF_SIZE) || 1024,
    audio: Number(process.env.MAX_AUDIO_SIZE) || 1024,
    video: Number(process.env.MAX_VIDEO_SIZE) || 1024,
    doc: Number(process.env.MAX_DOC_SIZE) || 1024,
    other: Number(process.env.MAX_OTHER_SIZE) || 1024,
  },
  // database_url: process.env.DATABASE_URL_ATLAS,
  database: {
    name: process.env.DATABASE_NAME,
    port: process.env.DATABASE_PORT,
    ip: process.env.DATABASE_IP,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    atlasUrl: process.env.DATABASE_URL_ATLAS,
  },
  database_url:
    process.env.NODE_ENV === 'development'
      ? process.env.DATABASE_URL_ATLAS
      : `mongodb://${process.env.DATABASE_IP}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`, //mongodb://127.0.0.1:29017/chouatamar
  default_student_pass: process.env.DEFAULT_STUDENT_PASS,
  default_moderator_pass: process.env.DEFAULT_MODERATOR_PASS,
  default_admin_pass: process.env.DEFAULT_ADMIN_PASS,
  bycrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  imgbb_key: process.env.IMGBB_KEY,
  crypto_key: process.env.ENCRYPTION_SECRET,
  resetlink: process.env.RESET_PASSWORD_LINK,
  server_side_url:
    process.env.NODE_ENV === 'production'
      ? process.env.REAL_HOST_SERVER_SIDE
      : process.env.LOCALHOST_SERVER_SIDE,
  client_side_url:
    process.env.NODE_ENV === 'production'
      ? process.env.REAL_HOST_CLIENT_SIDE
      : process.env.LOCALHOST_CLIENT_SIDE,
  jwt: {
    secret: process.env.JWT_SECRET,
    forgetPassword: process.env.JWT_FORGET_PASSWORD,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  payment_url: {
    stripe_success_url:
      process.env.NODE_ENV === 'development'
        ? process.env.STRIPE_SUCCESS_URL_LOCAL
        : process.env.STRIPE_SUCCESS_URL,
    stripe_cancel_url:
      process.env.NODE_ENV === 'development'
        ? process.env.STRIPE_CANCEL_URL_LOCAL
        : process.env.STRIPE_CANCEL_URL,
    paypal_success_url:
      process.env.NODE_ENV === 'development'
        ? process.env.PAYPAL_SUCCESS_URL_LOCAL
        : process.env.PAYPAL_SUCCESS_URL,
    paypal_cancel_url:
      process.env.NODE_ENV === 'development'
        ? process.env.PAYPAL_CANCEL_URL_LOCAL
        : process.env.PAYPAL_CANCEL_URL,
  },
  paypal: {
    client: process.env.PAYPAL_CLIENT_ID,
    secret: process.env.PAYPAL_SECRET_KEY,
  },
  nodemailer: {
    auth_user: process.env.NODEMAILER_AUTH_EMAIL,
    auth_pass: process.env.NODEMAILER_AUTH_PASS,
  },
  aws: {
    s3: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      region: process.env.AWS_S3_REGION,
      bucket: process.env.AWS_S3_BUCKET_NAME,
      cloudfrontCDN: process.env.AWS_S3_CLOUDFRONT_CDN,
    },
  },
  api_response_language: process.env.API_RESPONSE_LANGUAGE,
  // cloudinary_api_secret:process.env.cloudinary_api_secret
};
