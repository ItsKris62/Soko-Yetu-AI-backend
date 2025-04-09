module.exports = (requiredRole) => {
    return (req, res, next) => {
      if (!req.user?.role) {
        return res.status(401).json({ message: 'Missing user role' })
      }
  
      if (req.user.role !== requiredRole) {
        return res.status(403).json({ message: `Access restricted to ${requiredRole}s` })
      }
  
      next()
    }
  }
  