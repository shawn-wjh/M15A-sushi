const validation = require('../../src/middleware/user-validation');

describe('User Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks
    req = {
      body: {
        email: 'test@example.com',
        password: 'Test1234!'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  describe('validateEmail', () => {
    it('should call next() if email is valid', () => {
      // Act
      validation.validateEmail(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 if email is missing', () => {
      // Arrange
      req.body.email = undefined;

      // Act
      validation.validateEmail(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Email is required'
      });
    });

    it('should return 400 if email format is invalid', () => {
      // Arrange
      req.body.email = 'invalid-email';

      // Act
      validation.validateEmail(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid email format'
      });
    });

    it('should handle errors and return 500', () => {
      // Arrange
      req.body = null; // This will cause an error when accessing req.body.email

      // Act
      validation.validateEmail(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error validating email'
      });
    });
  });

  describe('validatePassword', () => {
    it('should call next() if password is valid', () => {
      // Act
      validation.validatePassword(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 if password is missing', () => {
      // Arrange
      req.body.password = undefined;

      // Act
      validation.validatePassword(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Password is required'
      });
    });

    it('should return 400 if password is too short', () => {
      // Arrange
      req.body.password = 'Short1!';

      // Act
      validation.validatePassword(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Password must be at least 8 characters long'
      });
    });

    it('should return 400 if password has no uppercase letters', () => {
      // Arrange
      req.body.password = 'password123!';

      // Act
      validation.validatePassword(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Password must contain at least one uppercase letter'
      });
    });

    it('should return 400 if password has no numbers', () => {
      // Arrange
      req.body.password = 'Password!';

      // Act
      validation.validatePassword(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Password must contain at least one number'
      });
    });

    it('should return 400 if password has no special characters', () => {
      // Arrange
      req.body.password = 'Password123';

      // Act
      validation.validatePassword(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Password must contain at least one special character'
      });
    });

    it('should handle errors and return 500', () => {
      // Arrange
      req.body = null; // This will cause an error when accessing req.body.password

      // Act
      validation.validatePassword(req, res, next);

      // Assert
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error validating password'
      });
    });
  });
});
