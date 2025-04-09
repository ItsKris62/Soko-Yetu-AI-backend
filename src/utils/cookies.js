exports.setAuthCookie = (res, token) => {
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    })
  }
  
  exports.clearAuthCookie = (res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    })
  }
  