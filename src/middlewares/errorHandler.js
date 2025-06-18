const errorHandler = (err, req, res, next) =>{
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    if(process.env.NODE_ENV === 'development'){
        console.error(err);
    }
    res.status(statusCode).json({
        success: false,
        message
    });
}

module.exports = errorHandler;