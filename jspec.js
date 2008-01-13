jspec = {
	fn_contents: function(fn) {
		return fn.toString().match(/^[^\{]*{((.*\n*)*)}/m)[1];
	},
	TOP_LEVEL: 0,
	DESCRIBE: 1,
	IT_SHOULD: 2,
	FAILURE: 3,
	logger: function(state, message) {
		switch(state) {
			case jspec.TOP_LEVEL:
				console.log(message);
				break;
			case jspec.DESCRIBE:
				console.log("- " + message);
				break;
			case jspec.IT_SHOULD:
				console.log("  - " + message);
				break;
			case jspec.FAILURE:
				console.log("    " + message);
				break;
		}
		
	},
	describe: function(str, desc) {
		jspec.logger(jspec.TOP_LEVEL, str);
		var it = function(str, fn) {
			jspec.logger(jspec.DESCRIBE, str);
			fn.call();
		};
		Object.prototype.should = function(fn_str, to_compare, not) {
		  try {
			  var pass = jspec.matchers[fn_str].matches.call(this, to_compare);
				if(not) var pass = !pass;
			} catch(e) {
			  var pass = null;
			}
			var should_string = (jspec.matchers[fn_str].describe && 
			  jspec.matchers[fn_str].describe.call(this, to_compare, not)) || 
			  this.toString() + " should " + (not ? "not " : "") + fn_str + " " + to_compare;
			if(pass) {
				jspec.logger(jspec.IT_SHOULD, should_string + " (PASS)");
			}	else {
				jspec.logger(jspec.IT_SHOULD, should_string + (pass == false ? " (FAIL)" : " (ERROR)"));
				jspec.logger(jspec.FAILURE, jspec.matchers[fn_str].failure_message.call(this, to_compare, not))
			}
		};
		Object.prototype.should_not = function(fn_str, to_compare) {
			this.should(fn_str, to_compare, true);
		};
		x = desc.toString()
		var fn_body = this.fn_contents(desc);
		var fn = new Function("it", fn_body);
		fn.call(this, it);
		delete Object.prototype.should
		delete Object.prototype.should_not
	}
}

// Helper for 

jspec.print_object = function(obj) {
  if(obj instanceof Function) {
    return obj.toString().match(/^([^\{]*) {/)[1];
	} else if(obj instanceof Array) {
		return "[" + obj.toString() + "]";
  } else {
    return obj.toString().replace(/\n\s*/g, "");
  }
}

// Matchers begin here

jspec.matchers = {};

jspec.matchers["=="] = {
  describe: function(target, not) {
    return jspec.print_object(this) + " should " + (not ? "not " : "") + "equal " + jspec.print_object(target)
  },
	matches: function(target) {
		return this == target;
	},
	failure_message: function(target, not) {
		if (not)
			return "Expected " + jspec.print_object(this) + " not to equal " + jspec.print_object(target);
		else
			return "Expected " + jspec.print_object(this) + ". Got " + jspec.print_object(target);
	}
}

jspec.matchers["include"] = {
	matches: function(target) {
		if(Array.prototype.indexOf) return Array.prototype.indexOf.call(this, target) != -1;
		else {
			for(i=0,j=this.length;i<j;i++) {
				if(target == this[i]) return true;
			}
			return false;
		}
	},
	failure_message: function(target, not) {
		return "Expected [" + jspec.print_object(this) + "] " + (not ? "not " : "") + "to include " + target;
	}  
}

jspec.matchers["exist"] = {
  describe: function(target, not) {
    return jspec.print_object(this) + " should " + (not ? "not " : "")  + "exist."
  },
  matches: function(target) {
    return !!this;
  },
  failure_message: function(target, not) {
    return "Expected " + (not ? "not " : "") + "to exist, but was " + jspec.print_object(this);
  }
}