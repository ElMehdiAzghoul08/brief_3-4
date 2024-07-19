const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: "azghoulmehdi899@gmail.com",
      pass: "",
     }
});

exports.sendVerificationEmail = async (email, token) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Vérification de compte',
        html: `<p>Cliquez sur ce lien pour vérifier votre compte : ${process.env.BASE_URL}/verify-email/${token}</p>`
    };
    await transporter.sendMail(mailOptions);
};

exports.sendPasswordResetEmail = async (email, token) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Réinitialisation de mot de passe',
        html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : ${process.env.BASE_URL}/reset-password/${token}</p>`
    };
    await transporter.sendMail(mailOptions);
};