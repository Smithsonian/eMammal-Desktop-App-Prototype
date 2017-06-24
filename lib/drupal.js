var RSVP = require('rsvp');
var storage = require('electron-json-storage');

function getActiveProjects(auth) {
  return new RSVP.Promise(function(resolve, reject) {
    $.getJSON('../fixtures/getActiveProjects.json', function(data) {
      if (!data.length) {
        alert('Woops! Fill in the files in fixtures to see this work');
      }
      resolve(data);
    });
  });
}

function getSubprojects(projectId) {
  return new RSVP.Promise(function(resolve, reject) {
    $.getJSON('../fixtures/getSubprojects.json', function(data) {
      resolve(data);
    });
  });
}

function getDeployments(subprojectId) {
  return new RSVP.Promise(function(resolve, reject) {
    $.getJSON('../fixtures/getDeployments.json', function(data) {
      resolve(data);
    });
  });
}

/*
 * Given a getActiveProjects response, caches project/subproject/deployment info to local storage.
 * - stores getActiveProjects(), as metadata-projects
 * - stores a mapping between project IDs to lists of subprojects, as metadata-subprojects
 * - stores a mapping between subproject IDs to lists of deployments, as metadata-deployments
*/
function snapshotMetadata(projects) {
  storage.set('metadata-projects', projects, function(error) {
    if (error) throw error;
  });

  var getSubprojectPromises = projects.map(function(project) {
    return getSubprojects(project.project_id);
  });

  RSVP.all(getSubprojectPromises).then(function(subproject_lists) {
    var projectsToSubprojects = {};
    var subprojectIds = [];
    for (var i = 0; i < subproject_lists.length; i++) {
      var projectId = projects[i].project_id;
      var subprojects = subproject_lists[i];
      projectsToSubprojects[projectId] = subprojects;
      for (var j = 0; j < subprojects.length; j++) {
        subprojectIds.push(subprojects[j].subproject_id);
      }
    }

    storage.set('metadata-subprojects', projectsToSubprojects, function(error) {
      if (error) throw error;
    });

    var getDeploymentPromises = subprojectIds.map(function(subprojectId) {
      return getDeployments(subprojectId);
    });

    RSVP.all(getDeploymentPromises).then(function(deploymentLists) {
      var subprojectsToDeployments = {};
      for (var j = 0; j < deploymentLists.length; j++) {
        var subprojectId = subprojectIds[j];
        subprojectsToDeployments[subprojectId] = deploymentLists[j];
      }

      storage.set('metadata-deployments', subprojectsToDeployments, function(error) {
        if (error) throw error;
      });
    });
  });
}

exports.getActiveProjects = getActiveProjects;
exports.getSubprojects = getSubprojects;
exports.getDeployments = getDeployments;
exports.snapshotMetadata = snapshotMetadata;