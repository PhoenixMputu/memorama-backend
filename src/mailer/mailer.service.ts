import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}

  private async transporter() {
    try {
      // Créer un objet de transport Nodemailer avec les paramètres spécifiés
      const transporter = nodemailer.createTransport({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        ignoreTLS: true,
        auth: {
          user: this.configService.get('MAILER_USER')!,
          pass: this.configService.get('MAILER_PASSWORD')!,
        },
      });

      // Retourner l'objet transporter créé
      return transporter;
    } catch (error) {
      // Gérer les erreurs potentielles liées à la création du compte de test ou du transporter
      console.error('Erreur lors de la création du transporter :', error);
      throw error; // Propager l'erreur pour une gestion ultérieure
    }
  }

  async sendSignupConfirmation(
    email: string,
    code: string,
  ) {
    (await this.transporter()).sendMail({
      from: '"No Reply" <app@localhost.com>',
      to: email,
      subject: "Validation d'inscription",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              text-align: center;
              margin: 20px;
            }
        
            h1 {
              color: #3498db;
            }
        
            p {
              color: #555;
            }
        
            .verification-link {
              display: inline-block;
              padding: 10px 20px;
              margin: 15px 0;
              font-size: 16px;
              color: #fff;
              text-decoration: none;
              background-color: #3498db;
              border-radius: 5px;
            }

            .link {
              text-decoration: none;
              color: #3498db;
            }

          </style>
        </head>
        
        <body>
          <h1>Validation d\'inscription</h1>
          <p>Cher ${email},</p>
          <p>Merci pour votre inscription. Veuillez utiliser le code suivant pour finaliser le processus : <strong>${code}</strong></p>
          <p>Le code expire dans 7 jours</p>
          <p>Si vous n\'avez pas initié cette demande, veuillez ignorer cet e-mail.</p>
          <p>Merci,</p>
        </body>
        
        </html>      
      `,
    });
  }

  async sendLinkNewPassword(
    email: string,
    url: string
  ) {
    (await this.transporter()).sendMail({
      from: '"No Reply" <app@localhost.com>',
      to: email,
      subject: "Validation d'inscription",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              text-align: center;
              margin: 20px;
            }
        
            h1 {
              color: #3498db;
            }
        
            p {
              color: #555;
            }
        
            .verification-link {
              display: inline-block;
              padding: 10px 20px;
              margin: 15px 0;
              font-size: 16px;
              color: #fff;
              text-decoration: none;
              background-color: #3498db;
              border-radius: 5px;
            }

            .link {
              text-decoration: none;
              color: #3498db;
            }

          </style>
        </head>
        
        <body>
          <h1>Changement de mot de passe</h1>
          <p>Cher ${email},</p>
          <p>Nous avons reçu une demande de réinitialisation de votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour procéder au changement de mot de passe :</p>
          <a href="${url}" class="button">Changer de mot de passe</a>
          <p>Le lien expire dans 24 heures</p>
          <p>Si vous n\'avez pas initié cette demande, veuillez ignorer cet e-mail.</p>
          <p>Merci,</p>
        </body>
        
        </html>      
      `,
    });
  }
}
