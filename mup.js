fs = require('fs');
secrets = JSON.parse(fs.readFileSync('secrets.json'));
module.exports = {
  servers: {
    one: {
      host: 'prooflog.com',
      username: 'root',
      pem: "~/.ssh/id_rsa"
    }
  },

  app: {
    name: 'prooflog',
    path: '.',

    servers: {
      one: {},
    },

    buildOptions: {
      serverOnly: true,
    },

    env: {
      ROOT_URL: 'https://prooflog.com',
      MONGO_URL: 'mongodb://localhost/meteor',
      MAIL_URL: secrets.mail_url,
    },

    ssl: { // (optional)
      // Enables let's encrypt (optional)
      autogenerate: {
        email: 'admin@prooflog.com',
        // comma separated list of domains
        domains: 'prooflog.com'
      }
    },

    docker: {
      // change to 'abernix/meteord:base' if your app is using Meteor 1.4 - 1.5
      image: 'abernix/meteord:node-8.9.3-base',
      prepareBundle: false,
    },

    // Show progress bar while uploading bundle to server
    // You might need to disable it on CI servers
    enableUploadProgressBar: true
  },

  mongo: {
    version: '3.4.1',
    servers: {
      one: {}
    }
  }
};
