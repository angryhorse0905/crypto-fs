var crypto = require('./crypto');
var config = require('../config');
var filename = require('./filename');
var path = require('path');
var _ = require('lodash');

function getPath(file) {
  var name = filename.encrypt(file);
  return path.normalize(config.root + '/' + name);
}

function asyncCb(cb, success) {
  return function (err, data) {
    if (err) {
      cb(err, null);
    } else {
      cb(err, success(data));
    }
  };
}

function formatBuffer(buffer, enc) {
  if (enc) {
    return buffer.toString(enc);
  } else {
    return buffer;
  }
}

// function reverseFilenameMap(folder) {
//   return function(fileName) {
//     var filePath = path.normalize(filename.encrypt(folder) + '/' + fileName);
//     var file = filename.decrypt(filePath);
//     return file.split('/').pop();
//   };
// }

module.exports = {
  readAsync: function(fn) {
    return function(file) {
      config.check();
      var args = _.toArray(arguments);
      var enc = args[1];
      var cb = args.pop();
      args[0] = getPath(file);
      args[1] = null;
      args.push(asyncCb(cb, function(data) {
        var buffer = crypto.decryptBuffer(data, config.password + ':' + file);
        return formatBuffer(buffer, enc);
      }));
      config.baseFs[fn].apply(config.baseFs, args);
    };
  },

  readSync: function(fn) {
    return function(file) {
      config.check();
      var args = _.toArray(arguments);
      var enc = args[1];
      args[0] = getPath(file);
      args[1] = null;
      var data = config.baseFs[fn].apply(config.baseFs, args);
      var buffer = crypto.decryptBuffer(data, config.password + ':' + file);
      return formatBuffer(buffer, enc);
    };
  },

  fs: function(fn) {
    return function(file) {
      config.check();
      var args = _.toArray(arguments);
      args[0] = getPath(file);
      return config.baseFs[fn].apply(config.baseFs, args);
    };
  },

  write: function(fn) {
    return function(file, data) {
      config.check();
      var args = _.toArray(arguments);
      args[0] = getPath(file);
      args[1] = crypto.encryptBuffer(data, config.password + ':' + file);
      return config.baseFs[fn].apply(config.baseFs, args);
    };
  }
};