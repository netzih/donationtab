const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Default email template
const DEFAULT_TEMPLATE = `Dear {name},

Thank you for your generous donation of {amount} to {organization}.

Your donation helps us continue our mission and make a difference.

Tax ID: {taxId}
Donation Date: {date}
Amount: {amount}

This email serves as your receipt for tax purposes.

With gratitude,
{organization} Team`;

// Format currency
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Format date
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Replace template placeholders
const renderTemplate = (template, data) => {
  return template
    .replace(/{name}/g, data.name)
    .replace(/{amount}/g, data.amount)
    .replace(/{organization}/g, data.organization)
    .replace(/{taxId}/g, data.taxId)
    .replace(/{date}/g, data.date);
};

// Send receipt email
const sendReceiptEmail = async (donorInfo, amount, donation) => {
  try {
    const transporter = createTransporter();

    // Get organization info from environment
    const orgName = process.env.ORG_NAME || 'Your Organization';
    const orgEmail = process.env.ORG_EMAIL || 'donations@yourorg.com';
    const orgTaxId = process.env.ORG_TAX_ID || '';

    // Prepare template data
    const templateData = {
      name: donorInfo.name,
      amount: formatCurrency(amount),
      organization: orgName,
      taxId: orgTaxId,
      date: formatDate(donation.created_at || new Date()),
    };

    // Get template (you can load this from database/config later)
    const template = DEFAULT_TEMPLATE;
    const emailBody = renderTemplate(template, templateData);

    // Email options
    const mailOptions = {
      from: `${orgName} <${orgEmail}>`,
      to: donorInfo.email,
      subject: `Donation Receipt from ${orgName}`,
      text: emailBody,
      html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${emailBody}</pre>`,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Receipt email sent:', info.messageId);

    return {success: true, messageId: info.messageId};
  } catch (error) {
    console.error('Error sending receipt email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

module.exports = {
  sendReceiptEmail,
  testEmailConfig,
};
