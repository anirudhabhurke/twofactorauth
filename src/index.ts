import express, { Request, Response, NextFunction } from 'express';
import speakeasy from 'speakeasy';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

import { getDb } from './utils/database';

const app = express();
app.use(express.json());

const db = getDb();

// register user and create temp_secret
app.post('/api/register', (req: Request, res: Response, next: NextFunction) => {
      const id = uuidv4();
      try {
            const path = `/user/${id}`;
            const temp_secret = speakeasy.generateSecret();
            db.push(path, { id, temp_secret });
            if (temp_secret.otpauth_url) {
                  QRCode.toDataURL(temp_secret.otpauth_url, (err, data_url) => {
                        return res.json({ id, secret: temp_secret.base32, qr_code_url: data_url });
                  });
            }
      } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Error generating secret' });
      }
});

// verify token and make temp_secret permanent
app.post('/api/verify', (req: Request, res: Response, next: NextFunction) => {
      const { token, userId } = req.body;
      try {
            const path = `/user/${userId}`;
            const user = db.getData(path);

            const { base32: secret } = user.temp_secret;

            const isVerified = speakeasy.totp.verify({ secret, encoding: 'base32', token });

            if (isVerified) {
                  db.push(path, { id: userId, secret: user.temp_secret });
                  return res.json({ verified: true });
            } else {
                  return res.json({ verified: false });
            }
      } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Error finding user' });
      }
});

// Validate a token
app.post('/api/validate', (req: Request, res: Response, next: NextFunction) => {
      const { token, userId } = req.body;

      try {
            const path = `/user/${userId}`;
            const user = db.getData(path);

            const { base32: secret } = user.secret;

            const isTokenValid = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });

            if (isTokenValid) {
                  return res.json({ validated: true });
            } else {
                  return res.json({ validated: false });
            }
      } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Error finding user' });
      }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));
