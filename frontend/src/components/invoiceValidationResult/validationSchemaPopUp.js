import { useState } from "react";
import { useHistory } from "react-router-dom";
import "./validationSchemaPopUp.css";

function ValidationSchemaPopUp({ onClose, invoiceIds }) {
  const [selectedSchemas, setSelectedSchemas] = useState([]);
  const [message, setMessage] = useState(null);
  const history = useHistory();

  if (invoiceIds.length === 0) {
    setMessage({ type: "error", message: "No invoice IDs provided" });
  }

  const handleSchemaChange = (schema) => {
    setSelectedSchemas((prev) => {
      if (prev.includes(schema)) {
        return prev.filter((s) => s !== schema);
      }
      return [...prev, schema];
    });
  };

  const handleClose = () => {
    setSelectedSchemas([]);
    onClose();
  };

  const handleConfirm = () => {
    if (selectedSchemas.length === 0) {
      setMessage({ type: "error", message: "Must select at least one schema" });
      return;
    }

    // turn invoiceIds and schemas array into a string
    const invoiceIdsString = invoiceIds.join("+");
    const schemasString = selectedSchemas.join("+");

    // redirect user to validation result page
    history.push(
      `/validation-result?schemas=${schemasString}&invoiceids=${invoiceIdsString}`
    );
  };

  return (
    <div className="validation-overlay" onClick={handleClose}>
      <div className="validation-pop-up" onClick={e => e.stopPropagation()}>
        <h1>Choose your validation schemas</h1>
        <div className="validation-schemas">
          <div 
            className={`schema-option ${selectedSchemas.includes('peppol') ? 'selected' : ''}`}
            onClick={() => handleSchemaChange('peppol')}
          >
            <input 
              type="checkbox" 
              value="peppol" 
              checked={selectedSchemas.includes('peppol')}
              onChange={() => {}} 
            />
            <label>PEPPOL (A-NZ)</label>
          </div>
          <div 
            className={`schema-option ${selectedSchemas.includes('fairwork') ? 'selected' : ''}`}
            onClick={() => handleSchemaChange('fairwork')}
          >
            <input 
              type="checkbox" 
              value="fairwork" 
              checked={selectedSchemas.includes('fairwork')}
              onChange={() => {}} 
            />
            <label>Fairwork Commission</label>
          </div>
        </div>
        {message && <div className="validation-message">{message.message}</div>}
        <div className="validation-buttons">
          <button onClick={handleClose} className="validation-buttons cancel">
            Cancel
          </button>
          <button onClick={handleConfirm} className="validation-buttons verify">
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

export default ValidationSchemaPopUp;
