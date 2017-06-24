var fs = require('fs');
var path = require('path');
var libzip = new require('node-zip');
var gcs = require('@google-cloud/storage');

const scratchDir = "/tmp/";

/* EXAMPLE MANIFEST:
{"userId":"613",
"projectId":"3012",
"subprojectId":"3036",
"deploymentId":"1229",
"images":[
{"originalFileName":"122901050001.JPG","boundingBoxes":[],"imageId":"1229s105i1","isFavorite":false,"fileName":"1229s105i1.JPG"},
{"originalFileName":"122901050002.JPG","boundingBoxes":[],"imageId":"1229s105i2","isFavorite":false,"fileName":"1229s105i2.JPG"},
{"originalFileName":"122901050003.JPG","boundingBoxes":[],"imageId":"1229s105i3","isFavorite":false,"fileName":"1229s105i3.JPG"},
{"originalFileName":"122901050004.JPG","boundingBoxes":[],"imageId":"1229s105i4","isFavorite":false,"fileName":"1229s105i4.JPG"},
{"originalFileName":"122901050005.JPG","boundingBoxes":[],"imageId":"1229s105i5","isFavorite":false,"fileName":"1229s105i5.JPG"}],
"numImages":5,
"bboxed":false,
"sequenceId":"1229s105",
"sequenceNumber":105,
"isIdentified":true,
"runHash":"d06b9ebec0dada5ed8e35930f0872bcd54e09b57",
"isUploaded":false,
"identifications":[{"speciesId":"41686","count":1}]
}
*/

/* should prooooobably just accept one hash as argument */
function packSequence(userId, projectId, subprojectId, deploymentId, sequenceNumber, imagePaths, identifications) {
  var generatedImages = [];
  for (var i = 0; i < imagePaths.length; i++) {
  	var iid = deploymentId.toString() + 's' + sequenceNumber.toString() + 'i' + i.toString();
    var imageData = {
      originalFileName: imagePaths[i].split('/').pop(),
      boundingBoxes: [],
      imageId: iid,
      isFavorite: false,
      fileName: iid + '.JPG'
    };
    generatedImages.push(imageData);
  }

  manifest = {
  	userId: userId.toString(),
  	projectId: projectId.toString(),
    subprojectId: subprojectId.toString(),
    deploymentId: deploymentId.toString(),
    images: generatedImages,
    numImages: imagePaths.length,
    bboxed: false,
    sequenceId: deploymentId.toString() + 's' + sequenceNumber.toString(),
    sequenceNumber: sequenceNumber.toString(),
    isIdentified: true,
    runHash: "------PLACEHOLDER------",
    isUploaded: false,
    identifications: identifications
  };

  var archivePath = archiveSequence(imagePaths, manifest);
  //cloudUpload(archivePath);
}

/* images is an array of absolute paths to image files */
/* manifest is a javascript object which will be serialized into the manifest.json */
function archiveSequence(images, manifest) {
  console.log(images);
  console.log(manifest);
  var uploadNames = {};
  for (var i = 0; i < manifest.images.length; i++) {
    var hash = manifest.images[i];
    uploadNames[hash["originalFileName"]] = hash["fileName"]; 
  }

  var zipfile = libzip();
  for (var i = 0; i < images.length; i++) {
  	var path = images[i];
  	var filename = path.split('/').pop();
  	zipfile.file(uploadNames[filename] || filename, fs.readFileSync(path))
  }
  zipfile.file('manifest.json', JSON.stringify(manifest));

  var archiveName = manifest.projectId + manifest.sequenceId + '.zip';
  var data = zipfile.generate({base64: false, compression: 'DEFLATE'});
  fs.writeFileSync(scratchDir + archiveName, data, 'binary');

  return scratchDir + archiveName;
}

function cloudUpload(archivePath) {
  var gcsClient = gcs({
    projectId: "lol",
    keyFilename: 'path/to/keyfile,json'
  });

  var bucket = gcs.bucket('some-bucket');
  bucket.upload(archivePath, function(err, file) {
    if (!err) {
      console.log("Upload complete!");
    }
  });
}

exports.packSequence = packSequence;