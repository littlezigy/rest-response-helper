let links = {};
let innerLinks = {};
let baseurl = '';
let schema = null;
let recentLink = null;
let resources = {};
let todebug = false;

let embedded = {};

const config = function(configObj) {
    if(typeof configObj === 'object') {
        baseurl = (configObj.baseurl) ? configObj.baseurl : (configObj.URL) ? configObj.URL : (configObj.baseURL) ? configObj.baseURL : '';
    } else if(typeof configObj === 'string') {
        baseurl = configObj;
    }
    if(todebug === true) console.info('All links will now be prefixed with', baseurl);
}
const hrefLink = function(link, element = null) {
    //link = {href, ...}
    if(typeof linkObj !== 'string') link = JSON.parse(JSON.stringify(link)); //For immutable Object

    //If link is an object, then it has a named object  = 'key' containing property 'property'. 'property' exists in the object(s) in element.
    //Get value of 'property' from object(s) in element and replace string `:key` with the value in Object
    if(typeof link === 'object' && link !== null) {
        let templateVars = link.href.match(/(?<=\/:)[^\/]*/g);

        Object.keys(link).forEach(template => {
            if(templateVars.includes(template)) {
                if(link[template] !== null && typeof link[template] === 'object') {
                    let property = link[template].property;
                    if(element.hasOwnProperty(property)) {
                        link.href = link.href.split(":" + template).join(element[property]);
                    } else console.debug('PROEPRTY DOESN\'T EXIST'); // throw {error: "property not defined in link"}

                } else link.href = link.href.split(":" + template).join(link[template]);
                //console.log(link.href);
            }
        });
     //   return baseurl + link.href;
        return link.href;
    //} else return baseurl + link;
    } else return link;
}

const templatedLink = function(linkObj) {
    let templateVars = linkObj.href.match(/(?<=\/:)[^\/]*/g);
    let newLink = linkObj.href
    //For each object in link, except href
    Object.keys(linkObj).forEach(linkVar => {
        if(linkVar !== 'href') {
            if(typeof linkObj[linkVar] === 'string' || typeof linkObj[linkVar] === 'number') {
                newLink = newLink.split(":" + linkVar).join(linkObj[linkVar]);
            }
        }
    });
    return  newLink;
}

functions = (req, res, next) => {
    "use strict";
        
    res.debug = function(setDebug = true) {
        if(setDebug !== true && setDebug !== false) throw "Invalid Debug option. Please set as true or false";
        todebug = setDebug;
    }
    res._links = links,
    //TODO: Add Link title by using chainable object, eg res.link().title();
    res.link = function(nameObj, link, method = null, internalLink = true) {
        let href;
        let name, title;
        if(typeof nameObj === 'object' && nameObj !== null) {
            name = nameObj.name
            title = nameObj.title;
        }
        else name = nameObj

        if(typeof link !== 'string' && typeof link === 'object' && link !== null) {
            href = templatedLink(link);
        }
        else href = link;

        if(internalLink === true) href = baseurl + href;

        res.recentLink = links[name] = {
           href,
           ...title && {title}, 
           ...arguments[2] && {meta: {method: arguments[2].toUpperCase()} },
           ...arguments[3] && {schema: arguments[3]}
        };
        recentLink = links[name];
        return this;
    }
    res.innerLink = function(xxx, nameObj, link, method = null, internalLink = true) {
        let href;

        let meta = (method!== null) ? {method} : null;

        let name, title;
        if(typeof nameObj === 'object' && nameObj !== null) {
            name = nameObj.name
            title = nameObj.title;
        }
        else name = nameObj


        if(Array.isArray(xxx)) {
            xxx.forEach(element => {
                if(internalLink === true)    href = baseurl + hrefLink(link, element)
                else    href = hrefLink(link, element)

                if(!element._links) {
                    element._links = {};
                }

                element._links[name] = { ...title && {title}, href, ...meta && {meta}, ...schema && {schema} };
            });
        } else if(typeof xxx === 'object' && xxx !== null) {
                if(internalLink === true)    href = baseurl + hrefLink(link, xxx)
                else    href = hrefLink(link, xxx)

                if(!xxx._links) {
                    xxx._links = {};
                }
            xxx._links[name] = { href, ...title && {title}, ...meta && {meta}, ...schema && {schema} };
        }
    },

    res.embed = function(name, data, parent = null) {
        if((typeof data !== 'object' && data === null) && typeof data !== 'array') throw new Error('The second parameter should be an object.');
        if(parent === null) {
            embedded[name] = data;
        }
    }
        

    res.schema = function(data) {
        schema = data;
    }
    res.prev = {
        schema: function(schema) {
            recentLink.schema = schema;
        }
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
        recentLink = null;
        resources = {};
    }

    res.add = function(name, payload) {
        resources[name] = payload;
    }

    /**
     * @params {message} - Error message
     */
    res.success = function() {
        let message = (arguments[0]!== null && typeof arguments[0] === 'string') ? arguments[0] : "Operation Successful";
        
        let data = (typeof arguments[0] === 'object' || typeof arguments[0] === 'array') ? arguments[0] : 
                   (typeof arguments[1] === 'object' || typeof arguments[0] === 'array') ? arguments[1] : null;
        let _links = (Object.keys(links).length > 0) ? links : null;
        let _embedded = (Object.keys(embedded).length > 0) ? embedded : null;
        let resources_ = (Object.keys(resources).length > 0) ? resources : null;
		res.send({success: message, ...resources_ && {...resources}, ...schema && {schema}, ...data && {data}, ..._embedded && {_embedded},  ..._links && {_links}});
        embedded = {};
        links = {};
        schema = null;
        recentLink = null;
        resources = {};
    }

    res.fail = function() {
        console.log('Failure response');
        let message = (arguments[0]!== null && typeof arguments[0] === 'string') ? arguments[0] : "Operation Failed";
        
        let data = (typeof arguments[0] === 'object' || typeof arguments[0] === 'array') ? arguments[0] : 
                   (typeof arguments[1] === 'object' || typeof arguments[0] === 'array') ? arguments[1] : null;
        let _links = (Object.keys(links).length > 0) ? links : null;
        let _embedded = (Object.keys(embedded).length > 0) ? embedded : null;
        let resources_ = (Object.keys(resources).length > 0) ? resources : null;
		res.send({failure: message, ...resources_ && {...resources}, ...schema && {schema}, ...data && {data}, ..._embedded && {_embedded},  ..._links && {_links}});
        embedded = {};
        links = {};
        schema = null;
        recentLink = null;
        resources = {};
    }
    next();
}

module.exports = { functions, config }
