const getResetTemplate = (resetLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
    <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">Reset Your Password</h2>
    <p style="color: #666; font-size: 16px;">You requested a password reset for your EstateERP account.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="display: inline-block;
                padding: 12px 30px;
                background: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: bold;">
        Reset Password
      </a>
    </div>

    <p style="color: #999; font-size: 14px;">
      This link will expire in 1 hour.
    </p>

    <p style="color: #999; font-size: 14px;">
      If you didn't request this, please ignore this email or contact support.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
    
    <p style="color: #999; font-size: 12px; text-align: center;">
      &copy; 2024 EstateERP. All rights reserved.
    </p>
  </div>
`;

module.exports = getResetTemplate;