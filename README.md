# zimbra-zimlet-lifesize
* This Zimlet for Zimbra 8.8.x allows the reservation of Lifesize virtual rooms with integration of login credentials directly in the text of the meeting message.
* It was made based on code from Barry de Graaff https://github.com/Zimbra-Community/startmeeting.

![Zimlet reservation](https://raw.githubusercontent.com/Zimbra-Community/zimbra-zimlet-lifesize/main/ressources/zimlet-image1.png)

## Download
* You can download, deploy and test vesrion 1.0.0 directly: fr_cd21_startmeetiing.zip
* It is configured in simulation mode (no call to the web service).
* You can also download the sources with the command:

	`` bash
	git clone https://github.com/Zimbra-Community/startmeeting
	`` ``
	
## Zimlet configuration

* The configuration of the zimlet is carried out through the intermediary of the file: * config_template.xml *. This file defines, among other things, the key lifesize API for connection with the lifesizecloud.com reservation web service.
virtual room

		<global>	
			<! - Connection url to lifesizecloud.com ->
			<property name = "lifeSizeCreateMeetingURL"> https://meetingapi.lifesizecloud.com/meeting/create </property>
			<property name = "lifeSizeConnectMeetingURL"> https://call.lifesizecloud.com </property>
			<property name = "lifeSizeConnectSkypeMeetingURL"> https://skype.lifesizecloud.com </property>
	
			<! - API key for using the lifesizecloud.com webservice ->
			<property name = "lifeSizeMeetingAPIKey"> 123456789 </property>
			<property name = "lifeSizeConnectAudio"> 01 01 01 01 01 </property>
			
			<! - Extension code of the lifesize user for which the reservation is associated ->	
			<property name = "lifeSizeUserExtension"> 123456 </property>
			
			<! - Generic name appearing in the description of the reservation on the lifesizecloud.com side ->
			<property name = "lifeSizeMeetingOwner"> Zimlet </property>
			
			<! - Configuration of the type of virtual room reservation -> 
			<property name = "lifeSizeTempMeeting"> true </property>
			<property name = "lifeSizeHiddenMeeting"> false </property>
			<property name = "lifeSizePrivateMeeting"> true </property>
		</global>
		
## Configuration of text messages
* All messages are saved in * templates / Startmeeting.template *. It is an xml file that will be compiled by zimbra during deployment to produce a javascript interface that will be used to extract and expand messages from the * fr_cd21_startmeeting.js * zimlet.
* Each template is identified by a unique * id * containing text (html or text / plain), and variables identified by the syntax * <$ = data.param $> * which will be replaced automatically during calls to the zimbra function :

`` javascript
AjxTemplate.expand ("fr_cd21_startmeeting.templates.Startmeeting # about",
						{name: "Zimlet", description: "MyZimlet", version: "1.0.0"});
`` ``
	
	<template id = "about">
		<img class = 'img_cd21_startmeeting_dlg' src = '<$ = data.image $>' />
		<div>
			<p> Zimlet: <$=data.name$> </p>
			<p> Description: <$=data.description$> </p>
			<p> version: <$=data.version$> </p>
		</div>
	</template>
* the template identified: * "startmeeting" * represents the text / html message which will be used to format the text zone of the meeting with the connection identifiers.

* the template identified: * "startmeeting_text" * represents the text / plain version of the previous message which will be used if the Zimbra editor is in text / plain mode.

## Activation, deactivation and simulation mode
* It is possible to define 3 zimlet operating modes from the keys of the * fr_cd21_startmeeting.properties * file, as well as the response time granted to the lifesize webservice.

	`` bash
	# 0: disabled (default value if not specified), 
	# 1: debug (simulation no call to the websertvice) 
	# 2: running (in operation)
	StartMeetingZimlet_lifeSizeRunning = 2
	#
	# Response time of the lifesize webservice in ms
	StartMeetingZimlet_lifeSizeTimeout = 5000
	`` ``
	
* The simulation mode allows you to debug the zimlet without calling the webservive and reserving virtual rooms unnecessarily.
	
* This property file does not require an uninstallation of the zimlet to be taken into account if modifications are made in production. A simple deployment is enough.

* Changing the zimlet operating mode can be done directly from the browser in the developer tools console with
the command: StartMeeting.lifeSizeRunning = * 0,1 or 2 *

![Zimlet operating mode](https://raw.githubusercontent.com/Zimbra-Community/zimbra-zimlet-lifesize/main/ressources/zimlet-image5.png)

## Encoding
* All files must be encoded in UTF-8 without bom, except jsp, which use ISO-8859-1 encoding.

## Naming convention
* This zimlet was developed for the Departmental Council of Côte-d'Or. The names of files and objects are prefixed with * cd21 *. It is advisable to adapt it by changing all or part of the name according to the context of use.

# Development tools
* I personally have a preference for Eclipse (version 2020-12 - Eclipse IDE for Enterprise Java Developers) to benefit from a suitable development environment.
* Any other text editor respecting the recommended encoding.
	
## Creation of the archive
* Deployment for zimbra requires building an archive (zip) which will be uploaded to the server via the administration interface.
* ** Warning ** the structure of the generated archive must respect the standardization of zimlets. see https://wiki.zimbra.com/wiki/Zimlet_Developers_Guide:Getting_Started

![Zimlet deployment](https://raw.githubusercontent.com/Zimbra-Community/zimbra-zimlet-lifesize/main/ressources/zimlet-image2.png)

* The * package.xml * file describes the structure as well as the files to be incorporated into the archive. It is executable from a console or Eclipse using * Ant * to produce a zip. This script will have to be adapted to the context for the generation of the final file.

	<zip destfile = "$ {workspace.dir} / _ ZimbraIntegration_ / dist / fr_cd21_startmeeting.zip"
	 	basedir = "$ {workspace.dir} / $ {project.name}"
	 	includes = "** / *. *"
	 	excludes = ". project, .settings / **, old / ** package.xml">
	</zip>

## Zimbra configuration
* Installing the zimlet requires configuring zimbra to allow clients to call the * lifesizecloud.com * webervice through the zimbra proxy.
* This configuration is performed directly from the Zimbra command line server.
* ** Note: ** Authorization to use domain for an account does not seem to work with our version of Zimbra. Authorization is defined at the * COS * level.

`` bash
  su - zimbra
  zmprov mc cos-domain-dsi + zimbraProxyAllowedDomains * .lifesizecloud.com
  # for one person (but does not work)
  # zmprov ma nicolas.Lavoillotte@domaine.fr +zimbraProxyAllowedDomains *.lifesizecloud.com (does not work!)
   
  # check:
  zmprov gc cos-domain-dsi | grep zimbraProxyAllowedDomains
  zimbraProxyAllowedDomains: *.lifesizecloud.com
  `` ``
  
* or from the administration interface
![Zimlet permission](https://raw.githubusercontent.com/Zimbra-Community/zimbra-zimlet-lifesize/main/ressources/zimlet-image3.png)

* Reloading the mailstore to take into account the changes

`` bash
  su - zimbra
  zmmailboxdctl restart
  `` ``

## Deployment and update
* The deployment will be carried out directly from the administration interface. With the deploy option in the Zimbra server configuration, Zimlet section.

![Zimlet reservation](https://raw.githubusercontent.com/Zimbra-Community/zimbra-zimlet-lifesize/main/ressources/zimlet-image2.png)

* ** Note: ** If modifications are made to the * config_template.xml * file after deployment, and for them to be taken into account, the configuration will have to be reloaded with the zimbra command:

`` bash
  su - zimbra
  # extract the configuration
  zmzimletctl getConfigTemplate fr_cd21_startmeeting.zip
  # installation of the configuration
  zmzimletctl configure config_template.xml
  `` ``
  

![Zimlet reservation](https://raw.githubusercontent.com/Zimbra-Community/zimbra-zimlet-lifesize/main/ressources/zimlet-image4.png)
