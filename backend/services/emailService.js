const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendConfirmationEmail = async (email, link) => {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.sender = {
        name: process.env.MAIL_FROM_NAME || 'NaRégua',
        email: process.env.MAIL_FROM_EMAIL || 'no-reply@naregua.com'
    };
    sendSmtpEmail.subject = 'Confirme sua conta - NaRégua';

    sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Bem-vindo ao NaRégua!</h2>
            <p>Obrigado por se cadastrar. Clique no botão abaixo para ativar sua conta:</p>
            <p>
                <a href="${link}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Confirmar E-mail
                </a>
            </p>
            <p>Ou copie e cole este link no seu navegador:</p>
            <p style="color: #666; font-size: 12px;">${link}</p>
            <br/>
            <p>Se você não criou esta conta, ignore este e-mail.</p>
        </div>
    `;

    try {
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('E-mail enviado. Message ID:', data.messageId);
        return data;
    } catch (error) {
        console.error('Erro ao enviar e-mail:', error);
        throw error;
    }
};

module.exports = { sendConfirmationEmail };
