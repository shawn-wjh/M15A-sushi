import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import apiClient from '../../utils/axiosConfig';

const PeppolSendOption = ({ invoiceId, onClose }) => {
  const [peppolConfigured, setPeppolConfigured] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const history = useHistory();

  useEffect(() => {
    const checkPeppolSettings = async () => {
      try {
        const response = await apiClient.get('/v1/users/peppol-settings');
        setPeppolConfigured(response.data?.status === 'success' && response.data?.data?.isConfigured);
      } catch (error) {
        console.error('Failed to check Peppol settings:', error);
        setPeppolConfigured(false);
      }
    };
    checkPeppolSettings();
  }, []);

  const handleSendConfirm = async () => {
    if (!peppolConfigured) {
      history.push("/dashboard?tab=settings&settings=peppol");
      onClose();
      return;
    }

    if (!recipientId) {
      setSendResult({
        status: 'error',
        message: 'Recipient ID is required'
      });
      return;
    }
    
    setIsSending(true);
    setSendResult(null);
    
    try {
      const response = await apiClient.post(`/v1/invoices/${invoiceId}/send`, {
        recipientId: recipientId
      });
      
      if (response.data?.status === 'success') {
        setSendResult({
          status: 'success',
          message: 'Invoice sent successfully via Peppol network',
          deliveryId: response.data.deliveryId,
          timestamp: response.data.timestamp
        });
      } else {
        setSendResult({
          status: 'error',
          message: 'Failed to send invoice'
        });
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      setSendResult({
        status: 'error',
        message: error.response?.data?.message || 'Failed to send invoice via Peppol'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Send Invoice via Peppol</h3>
        {!peppolConfigured ? (
          <>
            <p>Connect to your Peppol network provider in settings to send invoice.</p>
            <div className="modal-buttons">
              <button
                className="modal-button cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="send-peppol-button"
                onClick={handleSendConfirm}
              >
                Go to Settings
              </button>
            </div>
          </>
        ) : (
          <>
            <p>Enter the recipient's Peppol ID to send this invoice:</p>
            {sendResult && (
              <div className={`sending-result ${sendResult.status}`}>
                <p>{sendResult.message}</p>
                {sendResult.status === 'success' && sendResult.deliveryId && (
                  <div className="delivery-details">
                    <div className="detail-item">
                      <span className="detail-label">Delivery ID:</span>
                      <span className="detail-value">{sendResult.deliveryId}</span>
                    </div>
                    {sendResult.timestamp && (
                      <div className="detail-item">
                        <span className="detail-label">Timestamp:</span>
                        <span className="detail-value">{new Date(sendResult.timestamp).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="input-field">
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                placeholder="e.g., 0192:12345678901"
                required
                disabled={isSending || (sendResult && sendResult.status === 'success')}
              />
              <small>The recipient must be registered on the Peppol network</small>
            </div>
            
            <div className="modal-buttons">
              <button
                className="modal-button cancel"
                onClick={onClose}
              >
                Close
              </button>
              {(!sendResult || sendResult.status !== 'success') && (
                <button
                  className="send-peppol-button"
                  onClick={handleSendConfirm}
                  disabled={isSending}
                >
                  {isSending ? 'Sending...' : 'Send Invoice'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PeppolSendOption;
