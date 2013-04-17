
// Construct a message object according to the parameters

var args = function() {
    var ret = {}
    switch (typeof arguments[0]) {
        case "function":
            ret.method = arguments[0];
            
            // It is not suggest to pass parameters in anonymous
            // This code is used to handle the reply of post method.
            // Therefore , anonymous function do not accept callback paramter.
            ret.params = arguments[1];
            
            break;
        case "string":
            ret.method = arguments[0];
            
            if (arguments.length == 3){
                ret.params = arguments[1];
                ret.callback = arguments[2];
            } else if (arguments.length == 2) {
                if (typeof arguments[1] == "function") 
                    ret.callback = arguments[1];
                else
                    ret.params = arguments[1];
            }

            break;
        default:
            throw new Error("Invalid argument");
            break;
    }
    
    return ret;
}

var Message = function(args){ 
    this.method = args.method;
    this.params = args.params;
    this.callback = args.callback;
}

exports.create = function() {
    var msg = args.apply({},arguments);
    return new Message(msg);    
}