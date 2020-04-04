let links = {};
let innerLinks = {};
let baseurl = '';
let schema = null;

config = function(configObj) {
    if(typeof configObj === 'object') {
        baseurl = (configObj.baseurl) ? configObj.baseurl : (configObj.URL) ? configObj.URL : (configObj.baseURL) ? configObj.baseURL : '';
    } else if(typeof configObj === 'string') {
        baseurl = configObj;
    }
    console.info('All links will now be prefixed with', baseurl);
}
hrefLink = function(link, element) {
//link = {href, ...}
    if(typeof linkObj !== 'string') link = JSON.parse(JSON.stringify(link)); //For immutable Object

    if(typeof link === 'object' && link !== null) {
        console.log('------------------------------------\nLINK HREF FORM HOME', link);
        let templateVars = link.href.match(/(?<=\/:)[^\/]*/g);

        Object.keys(link).forEach(template => {
            if(templateVars.includes(template)) {
                console.log(link[template]);
                if(link[template] !== null && typeof link[template] === 'object') {
                    let property = link[template].property;
                    if(element.hasOwnProperty(property)) {
                        link.href = link.href.split(":" + template).join(element[property]);
                    } else console.log('PROEPRTY DOESN\'T EXIST'); // throw {error: "property not defined in link"}

                } else link.href = link.href.split(":" + template).join(link[template]);
                //console.log(link.href);
            }
        });
        return baseurl + link.href;
    } else return baseurl + link;
}

functions = (req, res, next) => {
        
    res.link = function() {
        links[arguments[0]] = {
           href: `${baseurl}${arguments[1]}`, 
           ...arguments[2] && {meta: {method: arguments[2].toUpperCase()} },
           ...arguments[3] && {schema: arguments[3]}
        };
    }
    res.innerLink = function(xxx, name, link, method = null) {
        console.log('BWANG');
        let href;

        let meta = (method!== null) ? {method} : null;

        if(Array.isArray(xxx)) {
            xxx.forEach(element => {
                href = hrefLink(link, element)
                if(!element._links) {
                    element._links = {};
                }

                element._links[name] = { href, ...meta && {meta}, ...schema && {schema} };
            });
        } else if(typeof xxx === 'object' && xxx !== null) {
                href = hrefLink(link, xxx)
                if(!xxx._links) {
                    xxx._links = {};
                }
            xxx._links[name] = { href, ...meta && {meta}, ...schema && {schema} };
        }
    },

    res.schema = function(data) {
        schema = data;
    }

    /**
     * @params {string} gerror - Error message.
     */
    res.gerror = function() {
        let title, code, detail;
        if(typeof arguments[0] === 'object') {
            let errobj = arguments[0];
            title = errobj.title;
            code = errobj.code;
            detail = errobj.detail;
        } else if(typeof arguments[0] === 'string') {
            if( /[A-Z]/g.test(arguments[0]) ) {
                title = arguments[0];
                code = arguments[1] || null;
            } else if( /[^A-Z]/g.test(arguments[0]) && /[-_]/.test(arguments[0]) ) {
                code = arguments[0];
                title = arguments[1] || null;
            }
            detail = arguments[2] || null;
        }
        let _links = (Object.keys(links).length > 0) ? links : null;

        if(res.statusCode == false || res.statusCode < 400) res.status(400);

        res.send({error: {...code &&  {code}, ...title && {title}, ...detail && {detail}, ..._links && {_links} }});
        links = {};
        schema = null;
    }

    /**
     * @params {message} - Error message
     */
    res.success = function() {
        let message = (arguments[0]!== null && typeof arguments[0] === 'string') ? arguments[0] : "Operation Successful";
        
        let data = (typeof arguments[0] === 'object' || typeof arguments[0] === 'array') ? arguments[0] : 
                   (typeof arguments[1] === 'object' || typeof arguments[0] === 'array') ? arguments[1] : null;
        let _links = (Object.keys(links).length > 0) ? links : null;
		res.send({success: message, ...schema && {schema}, ...data && {data}, ..._links && {_links}});
        links = {};
        schema = null;
    }

    res.failure = () => {
        let message = arguments[0] || "Operation Successful";
        let statusCode = arguments[1] || 400;
        let data = arguments[1] || null;

        res.status(statusCode).send({fail: message, ...data && {data}});
        links = {};
        schema = null;
    }
    next();
}

module.exports = { functions, config }
