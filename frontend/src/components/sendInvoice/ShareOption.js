const ShareOption = ({ onClose, invoiceId }) => {
    const onShare = () => {
        alert('Share not implemented yet');
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Share Invoice</h3>
                <div className="input-field">
                    <label htmlFor="recipient">Recipients</label>
                    <input type="text" id="recipient" />
                </div>
                <div className="modal-buttons">
                    <button className="modal-button cancel" onClick={onClose}>Cancel</button>
                    <button className="modal-button confirm" onClick={onShare}>Share</button>
                </div>
            </div>
        </div>
    )
}
