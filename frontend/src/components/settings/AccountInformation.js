export const AccountInformation = ({ user }) => {
  return (
    <>
      <div className="settings-placeholder">
        <div className="settings-option">
          <h3>Personal Information</h3>
          <p>Update your personal details and contact information</p>
          <div className="form-field" style={{ marginTop: "20px" }}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              defaultValue={user?.name || ""}
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              defaultValue={user?.email || ""}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-field">
            <label htmlFor="company">Company Name</label>
            <input
              type="text"
              id="company"
              defaultValue=""
              placeholder="Enter your company name"
            />
          </div>
          <button className="btn btn-primary" style={{ marginTop: "15px" }}>
            Save Changes
          </button>
        </div>

        <div className="settings-option">
          <h3>Business Information</h3>
          <p>Update your business details for invoicing</p>
          <div className="form-field" style={{ marginTop: "20px" }}>
            <label htmlFor="business-id">Business ID</label>
            <input
              type="text"
              id="business-id"
              placeholder="Enter your business ID"
            />
          </div>
          <div className="form-field">
            <label htmlFor="tax-id">Tax ID / VAT Number</label>
            <input type="text" id="tax-id" placeholder="Enter your tax ID" />
          </div>
          <div className="form-field">
            <label htmlFor="address">Business Address</label>
            <textarea
              id="address"
              rows="3"
              placeholder="Enter your business address"
            ></textarea>
          </div>
          <button className="btn btn-primary" style={{ marginTop: "15px" }}>
            Save Changes
          </button>
        </div>
        
        <div className="settings-option">
          <h3>Subscription</h3>
          <p>Manage your subscription and billing details</p>
          <div className="form-field" style={{ marginTop: "20px" }}>
            <label htmlFor="plan">Current Plan: Omakase</label>
            <ul> 
              <li>Unlimited invoices</li>
              <li>Full feature set</li>
              <li>Priority support</li>
            </ul>
            <button className="btn btn-primary" style={{ marginTop: "15px" }}>Manage Subscription</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountInformation;
