/** 
 * Configurations for different services - Singleton Object
 */
var configurations = (function(){

    /**
     * Set the configration based on the parameters
     * 
     * @param {string} type - the configuration to be updated
     * @param {object} settings - the settings to be configured
     */ 
    function setConfiguration(type, settings) {
        // Check the type by using switch
        switch(type) {
            case 'aws':
                updateSettingsAWS(settings);
              break;
            default:
                return false;
          }
    }   

    /**
     * Set AWS Settings
     * 
     * @param {object} settings - the settings to be configured
     */ 
    function updateSettingsAWS(settings) {
        // Prepare the configurations
        var options = {
            region: settings['region'] || '',
            accessKeyId: settings['accessKeyId'] || '',
            secretAccessKey: settings['secretAccessKey'] || '',
        };

        // Check if endpoint is passed
        if (settings['endpoint']) {
            options['endpoint'] = settings['endpoint'];
        }

        // Pass the configuration
        AWS.config.update(options);
        return true;
    }

    return {
        /**
         * Set the configrations
         */
        setConfiguration: function() {
            return setConfiguration.apply(this, arguments);
        }
    };

})();