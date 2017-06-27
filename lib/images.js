// node.js imports
const fs = require('fs');
const libexif = require('exif');
const RSVP = require('rsvp');

/* Asynchronously extract EXIF metadata from an impage path or Buffer */
function exif(imagePath) {
  return new RSVP.Promise(function(resolve, reject) {
    new libexif.ExifImage({ image: imagePath }, function(error, exifData){
      if (error) {
        return reject(imagePath, error);
      } else {
        return resolve(exifData);
      }
    });
  });
}

/* Returns an array of sequences, each of which is an array of image paths */
function sequencesFromDir(imageDir) {
  return new RSVP.Promise(function(resolve, reject) {
    fs.readdir(imageDir, {}, function (err, items) {
      var images = items.filter(function(name) {
        return name.split('.').pop() == 'JPG';
      }).map(function(name) {
        return imageDir + '/' + name;
      });

      var exifTasks = images.map(function(path) { return exif(path) });
      RSVP.all(exifTasks).then(function(exifs) {
        return resolve(computeSequences(images, exifs));
      }).catch(function (imagePath, error) {
      	return reject(error);
      });
    });
  });
}

/* Given an array of images and an array of their EXIF metadata, clusters them into sequences based on timestamp */
function computeSequences(images, exifs) {
  var sequences = [[]];
  var timeMapping = {};
  for (var i = 0; i < images.length; i++) {
  	timeMapping[exifs[i].exif.CreateDate] = images[i];
  }

  var timestamps = Object.keys(timeMapping);
  timestamps = timestamps.sort();
  var lastTime;
  for (var j = 0; j < timestamps.length; j++) {
    var image = timeMapping[timestamps[j]];
    var currentTime = parseExifTime(timestamps[j]);

    if (lastTime === undefined || currentTime - lastTime < 60000) {
      sequences[sequences.length - 1].push(image);
    } else {
      sequences.push([image]);
    }
    lastTime = currentTime;
  }
  console.log(sequences);
  return sequences;
}

/* Converts an EXIF timestamp (YYYY:MM:DD HH:mm:SS) to a Javascript Date */
function parseExifTime(timestamp) {
  var b = timestamp.split(/\D/);
  return new Date(b[0],b[1]-1,b[2],b[3],b[4],b[5]);
}
