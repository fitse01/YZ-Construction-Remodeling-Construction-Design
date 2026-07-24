import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const basePass = 'aghu_medf_zkzf_ppum';
const passOptions = [
  basePass,
  basePass.replace(/_/g, ' '),      // 'aghu medf zkzf ppum'
  basePass.replace(/_/g, ''),       // 'aghumedfzkzfppum'
];

const verifyOption = (pass: string): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log(`Testing with password format: "${pass}"`);
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'fitsumtafese01@gmail.com',
        pass: pass,
      },
    });

    transporter.verify((error) => {
      if (error) {
        console.log(`❌ Failed: ${error.message.substring(0, 100)}`);
        resolve(false);
      } else {
        console.log(`✅ Success! password format "${pass}" is correct.`);
        // Try sending test mail
        transporter.sendMail({
          from: '"Fitsum" <fitsumtafese01@gmail.com>',
          to: 'fitsumtafese01@gmail.com',
          subject: 'YZ Construction - SMTP Verification Success',
          text: 'SMTP setup works perfectly using this password format!',
        }).then(info => {
          console.log('✅ Test email sent:', info.messageId);
        }).catch(err => {
          console.error('❌ Failed to send email:', err);
        });
        resolve(true);
      }
    });
  });
};

const run = async () => {
  for (const opt of passOptions) {
    const ok = await verifyOption(opt);
    if (ok) {
      console.log('Match found! Updating the .env password now.');
      break;
    }
  }
};

run();
