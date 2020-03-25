let links = {};

module.exports = (req, res, next) => {
    res.link = function() {
        links[arguments[0]] = {
                                   href: arguments[1], 
                                   ...arguments[2] && {meta: {method: arguments[2].toUpperCase()} },
                                   ...arguments[3] && {schema: arguments[3]}
                               };
        console.log('LINKS', links);
    }

    /**
     * @params {string} gerror - Error message.
     */
    res.gerror = function() {
        let message = (arguments[0]!== null && typeof arguments[0] === 'string') ? arguments[0] : "Error";
        let data = (typeof arguments[0] === 'object' || typeof arguments[0] === 'array') ? arguments[0] : null;
        let statusCode = arguments[1] || 400;

        let _links = (Object.keys(links).length > 0) ? links : null;
        res.status(statusCode).send({ error: message, ...data && {data}, ..._links && {_links} });
    }

    /**
     * @params {message} - Error message
     */
    res.success = function() {
        let message = (arguments[0]!== null && typeof arguments[0] === 'string') ? arguments[0] : "Operation Successful";
        
        let data = (typeof arguments[0] === 'object' || typeof arguments[0] === 'array') ? arguments[0] : 
                   (typeof arguments[1] === 'object' || typeof arguments[0] === 'array') ? arguments[1] : null;
        let _links = (Object.keys(links).length > 0) ? links : null;
		res.send({success: message, ...data && {data}, ..._links && {_links}});
    }

    res.failure = () => {
        let message = arguments[0] || "Operation Successful";
        let statusCode = arguments[1] || 400;
        let data = arguments[1] || null;

        res.status(statusCode).send({fail: message, ...data && {data}});
    }
    next();
}
