
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
    
Message.prototype.name = function() {
    var ret = "[anonymous]";
    if (typeof this.method != "function")
        ret = this.method;
    return ret;
}

Message.prototype.reply = function(data) {
    if (!this.disposed ) {
        this.reply = function() {
            var error = new Error("[NActor] reply() is called for multiple time.");
            this._uncaughtExceptionHandler(error);
        }
        if (this.callback)
            this.callback(data);
        this._done(this);    
    }
}
    
Message.prototype.dispose = function() {
    this.disposed = true;
    this._done(this);
}
    
Message.prototype.done = function(callback) {
    this._done = callback;
}

Message.prototype.onUncaughtException = function(callback) {
    this._uncaughtExceptionHandler = callback;
}
    
exports.create = function() {
    var msg = args.apply({},arguments);
    return new Message(msg);    
}
