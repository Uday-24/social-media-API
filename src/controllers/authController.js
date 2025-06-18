const register = async(req, res, next) => {
    res.json('Register');
}
const login = async(req, res, next) => {
    res.json('Login');
}
const refreshToken = async(req, res, next) => {
    res.json('Refresh token');
}
const logout = async(req, res, next) => {
    res.json('Logout');
}

module.exports = {
    register,
    login,
    refreshToken,
    logout
}