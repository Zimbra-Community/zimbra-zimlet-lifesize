/**
 * This file is part of the StartMeeting Zimlet Copyright (C) 2014-2018 Barry de
 * Graaff
 * 
 * Fork : 12/2020 CD21, Nicolas Lavoillotte
 * 
 * Bugs and feedback: https://github.com/Lavoillotte/zimbra-zimlet-lifesize
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 2 of the License, or (at your option) any later
 * version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see http://www.gnu.org/licenses/.
 * 
 * 
 * Installation : 
 *			Voir README.mmd
 * Zimbra
 * 			Version		8.8.15	Linux Centos 6.10 final
 *
 * Zimlet
 * 			Version	
 *			26/01/2021	1.0.0	Adaptation du scripte d'origine, création d'un template pour enregistrter
 *								les messages,configuration.
 */

// Constructor
function fr_cd21_startmeeting_HandlerObject() {};


try {
	// Raccordement au parent ZmZimletBase
	fr_cd21_startmeeting_HandlerObject.prototype = new ZmZimletBase();
} catch (error) {
	console.log("fr_cd21_startmeeting : can't instanciate ZmZimletBase()");
}
fr_cd21_startmeeting_HandlerObject.prototype.constructor = fr_cd21_startmeeting_HandlerObject;

fr_cd21_startmeeting_HandlerObject.prototype.toString = function() {
	return "fr_cd21_startmeeting_HandlerObject";
};


/**
 * Creates the Zimbra OpenPGP Zimlet, extends
 * {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmZimletBase.html ZmZimletBase}.
 * 
 * @class
 * @extends ZmZimletBase
 */
var StartMeeting = fr_cd21_startmeeting_HandlerObject;

/**
 * Formatage string par remplacement de chaine et paramètre indicé
 * 
 * ex : format("Test {0} et valeur {1}",1,2) => ""Test 1 et valeur 2"
 */ 
StartMeeting.prototype.Format = function(text) {
	var a = text;
	for (k = 0; k < arguments.length; k++) {
		if (k > 0)
			a = a.replace(new RegExp("\\{" + (k - 1) + "\\}", 'g'),
					arguments[k]);
	}
	return a;
}
/**
 * Debugger : affiche un message dans la console de debogage zimbra côté client ou
 *			  dans la console du nagivateur
 *            depuis IE11 : https://zimbratest.cotedor.fr/?debug=1
 */
StartMeeting.prototype.debug = function (level, message) {
	try {
		if (window.DBG && window.DBG.getDebugLevel() >= level) {
			window.DBG.println(level, message);
			console.log(message);
		}
		if (window.Debug && window.Debug.debuggerEnabled) {
			console.log(message);
		}
	} catch (err) {
		console.log('fr_cd21_startmeeting zimlet debug error: ' + err);
	}
};

/**
 * This method gets called when Zimbra Zimlet framework initializes.
 */
StartMeeting.prototype.init = function () {
	try {
		console.log("debut StartMeeting.prototype.init");
		
		if (!String.prototype.encodeHTML) {
			  String.prototype.encodeHTML = function () {
			    return this.replace(/&/g, '&amp;')
			               .replace(/</g, '&lt;')
			               .replace(/>/g, '&gt;')
			               .replace(/"/g, '&quot;')
			               .replace(/'/g, '&apos;');
			  };
		}
		
		var zimletInstance = appCtxt._zimletMgr
				.getZimletByName('fr_cd21_startmeeting').handlerObject;
		var fullname = appCtxt.getActiveAccount().name.match(/.*@/);
		fullname = fullname[0].replace('@', '');
		//
		// Config de base issue de config_template.xml (necessite une suppression/déploiement si changement)
		StartMeeting.URL = zimletInstance._zimletContext.getConfig('lifeSizeCreateMeetingURL');
		StartMeeting.ConnectURL = zimletInstance._zimletContext.getConfig('lifeSizeConnectMeetingURL');
		StartMeeting.ConnectSkypeURL = zimletInstance._zimletContext.getConfig('lifeSizeConnectSkypeMeetingURL');
		StartMeeting.ConnectAudio = zimletInstance._zimletContext.getConfig('lifeSizeConnectAudio');
		
		StartMeeting.fullname = fullname;
		StartMeeting.userName = fullname.split(".")[1];
		
		StartMeeting.lifeSizeUserExtension = zimletInstance._zimletContext
				.getConfig('lifeSizeUserExtension');
		StartMeeting.lifeSizeMeetingAPIKey = zimletInstance._zimletContext
				.getConfig('lifeSizeMeetingAPIKey');
				
		StartMeeting.lifeSizeMeetingOwner = zimletInstance._zimletContext
				.getConfig('lifeSizeMeetingOwner');
			
		StartMeeting.lifeSizeTempMeeting = JSON.parse(zimletInstance._zimletContext
				.getConfig('lifeSizeTempMeeting'));
		StartMeeting.lifeSizeHiddenMeeting = JSON.parse(zimletInstance._zimletContext
				.getConfig('lifeSizeHiddenMeeting'));
		
		//
		// Config issue de fr_cd21_startmeeting.propertie (pas de suppression, simple déploiement si changement)	
		var value=zimletInstance.getMessage('StartMeetingZimlet_lifeSizeRunning');	
		if (!value || value.length==0)
			value="0";
		StartMeeting.lifeSizeRunning = parseInt(value,10);
		
		value=zimletInstance.getMessage('StartMeetingZimlet_lifeSizeTimeout');	
		if (!value || value.length==0)
			value="5000";
		StartMeeting.lifeSizeTimeout = parseInt(value,10);

		console.log("fin StartMeeting.prototype.init");
	} catch (err) {
		this.debug(AjxDebug.DBG1,'fr_cd21_startmeeting zimlet init error: ' + err);
	}
};

/**
 * Adds button to Calendar toolbar, call by notifyZimlet
 */
StartMeeting.prototype.initializeToolbar = function(app, toolbar, controller,
		viewId) {
	var viewType = appCtxt.getViewTypeFromId(viewId);
	// Dans la vue calendrier
	if (viewType == ZmId.VIEW_APPOINTMENT) {
		this.InitCalendarStartMeetingToolbar(toolbar, controller);
	}
};

/**
 * Initiates calendar toolbar.
 * 
 * @param {ZmToolbar}
 *            toolbar the Zimbra toolbar
 * @param {ZmCalController}
 *            controller the Zimbra calendar controller
 */
StartMeeting.prototype.InitCalendarStartMeetingToolbar = function(toolbar,
		controller) {
	var zimletInstance = appCtxt._zimletMgr
			.getZimletByName('fr_cd21_startmeeting').handlerObject;
	if (!toolbar.getButton("STARTMEETING")) {
		// ZmMsg.sforceAdd =
		// this.getMessage("StartMeetingZimlet_saveAsStartMeeting");
		var buttonIndex = toolbar.opList.length + 1;
		var button = toolbar.createOp("STARTMEETING", {
			text : zimletInstance.getMessage('StartMeetingZimlet_button'),
			index : buttonIndex,
		});
		toolbar.addOp("STARTMEETING", buttonIndex);

		var menu = new ZmPopupMenu(button); // create menu
		button.setMenu(menu);// add menu to button
		button.noMenuBar = true;
		button.removeAllListeners();
		button.removeDropDownSelectionListener();

		var mi = menu.createMenuItem(
						Dwt.getNextId(),
						{
							image : "cd21_startmeeting-panelIcon", // voir fr_cd21_startmeeting.css
							text : (zimletInstance.getMessage(
									'StartMeetingZimlet_addMeetingDetails')
									.indexOf('???') == 0)
									? 'Add StartMeeting information to the Appointment'
									: zimletInstance
											.getMessage('StartMeetingZimlet_addMeetingDetails')
						});
		mi.addSelectionListener(new AjxListener(this, this.ConfirmeDialog,
				[controller]));
	}
};
/**
 * Menu item de la zimlet
 */
StartMeeting.prototype.menuItemSelected = function(itemId) {
	switch (itemId) {
		case "STARTMEETING_ABOUT":
			this.AboutDialog("");
			break;
		default:
			// do nothing
			break;
	}

};
/**
 * Détermine si la réservation est ectivées
 * Cette valeur peut etre changée depuis la console du navigateur : 
 *
 * StartMeeting.lifeSizeRunning=valeur
 *
 * 0 : désactivé (valeur par défaut), 
 * 1 : debug (simulattion, pas d'appel au webservice) 
 * 2 : running
 */
StartMeeting.prototype.IsEnabled = function() {
	return StartMeeting.lifeSizeRunning>0;
}

/**
 * Détermine si la réservation est simulée
 * 0 : désactivé (valeur par défaut), 
 * 1 : debug (simulattion, pas d'appel au websertvice) 
 * 2 : running
 */
StartMeeting.prototype.IsSimulation = function() {
	return StartMeeting.lifeSizeRunning==1;
}

/**
 * Détermine si l'editeur est de type HTML
 */
StartMeeting.prototype.IsEditorHTML = function(controller) {
    return controller._composeView.getComposeMode() == "text/html";
}

/**
 * Détermine si le contenu du rendez-vous en cours contient déjà une réservation
 * recherche les mots clef dans le text du message en cours
 */
StartMeeting.prototype.ContentRoom = function(controller,words) {
	var content=controller._composeView.getHtmlEditor().getContent();
	var pattern="";
	words.forEach((function(element) {
		pattern+=this.Format("({0})+(.|[\r\n])*",element);	
	}).bind(this));
	var regex=new RegExp(pattern,"gi");
	if (content && content.match(regex))
		return true;
	return false;
}
/**
 * This method is called when a message is viewed in Zimbra. See
 * {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmZimletBase.html#onMsgView}.
 * 
 * @param {ZmMailMsg}
 *            msg - an email in
 *            {@link https://files.zimbra.com/docs/zimlet/zcs/8.6.0/jsapi-zimbra-doc/symbols/ZmMailMsg.html ZmMailMsg}
 *            format
 * @param {ZmMailMsg}
 *            oldMsg - unused
 * @param {ZmMailMsgView}
 *            msgView - the current ZmMailMsgView (upstream documentation
 *            needed)
 */
StartMeeting.prototype.onMsgView = function(msg, oldMsg, msgView) {
	try {
		var zimletInstance = appCtxt._zimletMgr
				.getZimletByName('fr_cd21_startmeeting').handlerObject;
	} catch (err) {
		this.debug(AjxDebug.DBG1,'fr_cd21_startmeeting zimlet onMsgView error: ' + err);
	}
};

/**
 * Lorsque l'utilisateur clique sur cette zimlet dans la fenêtre Mail : partie gauche, section zimlet
 */
StartMeeting.prototype.singleClicked = function() {
	//this.prefDialog();
};

/**
 * Lorsque l'utilisateur double clique sur cette zimlet dans la fenêtre Mail : partie gauche, section zimlet
 */
StartMeeting.prototype.doubleClicked = function() {
	//this.prefDialog();
};

/**
 * This method shows a `ZmToast` status message. That fades in and out in a few
 * seconds.
 * 
 * @param {string}
 *            text - the message to display
 * @param {string}
 *            type - the style of the message e.g. ZmStatusView.LEVEL_INFO,
 *            ZmStatusView.LEVEL_WARNING, ZmStatusView.LEVEL_CRITICAL
 */
StartMeeting.prototype.SetStatus = function(text, type) {
	var transitions = [ZmToast.FADE_IN, ZmToast.PAUSE, ZmToast.PAUSE,
			ZmToast.FADE_OUT];
	appCtxt.getAppController().setStatusMsg(text, type, null, transitions);
};

/**
 * A propos de cette zimlet
 */
StartMeeting.prototype.AboutDialog =  function() {
	var zimletInstance = appCtxt._zimletMgr
			.getZimletByName('fr_cd21_startmeeting').handlerObject;
	var dialog = appCtxt.getMsgDialog(); // get a simple message dialog
	var dataTemplate={
		image:zimletInstance.getResource("lifesize.png"),
		name:this._zimletContext.name,
		description:this._zimletContext.description,
		version:this._zimletContext.version
	};
	var message=AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#about", dataTemplate);
  	dialog.reset(); // reset the dialog

  	dialog.setMessage(message, DwtMessageDialog.INFO_STYLE); // set the message "info" style

  	dialog.popup(); // display the dialog

};

/**
 * Affichage d'un message d'information
 */
StartMeeting.prototype.MessageDialog = function(message, style) {
	var dialog = appCtxt.getMsgDialog(); // get a simple message dialog
	
  	dialog.reset(); // reset the dialog

  	dialog.setMessage(message, style || DwtMessageDialog.INFO_STYLE); // set the message "info" style

  	dialog.popup(); // display the dialog

};
/**
 * Affichage d'un message d'erreur avec envoie d'un rapport
 */
StartMeeting.prototype.ErrorDialog = function(message) {
	var dialog = appCtxt.getErrorDialog(); // get a simple message dialog

  	dialog.reset(); // reset the dialog

  	dialog.setMessage(message, DwtMessageDialog.CRITICAL_STYLE); // set the message "info" style

  	dialog.popup(); // display the dialog

};
/**
 * Vérifie si le service est actif
 * Vérifie que la réunion en cours possède un sujet
 * Vérifie que la réunion ne contient pas déjà une réunion, par recherche de mot-clef
 *
 * return false si la vérification a échioué
 */
StartMeeting.prototype.CheckupAppointement = function(controller) {
	
	if (!this.IsEnabled()) {
		var result = AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message4");
		this.MessageDialog(result);
		return false;
	}
	
	// le sujet du rendez-vous doit etre présent
	var subject=this.GetAppointementSubject(controller,"");   //GetAppointementDateStart(controller,true);
	if (subject.length==0) {
		// Sujet obligatoire
		this.MessageDialog(AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message5", {})
							,DwtMessageDialog.WARNING_STYLE)
		return false;
	}
	// Les mots clefs pour repérer une réservation dans le text du message
	var keyWords=AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#startmeeting_keywords", {}).split(",");
	// Il ne doit pas y avoir de réservation déjà faite
	if (this.ContentRoom(controller,keyWords)) {
		// Une réservation est déjà présente
		this.MessageDialog(AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message6", {})
							,DwtMessageDialog.WARNING_STYLE)
		return false;
	}
	return true;
	
}
//
// CD21
// Dialogue de confirmation avant création de la salle virtuelle
// @param {ZmCalController} controller the Zimbra calendar controller
StartMeeting.prototype.ConfirmeDialog = function(controller) {
	var zimletInstance = appCtxt._zimletMgr
			.getZimletByName('fr_cd21_startmeeting').handlerObject;
			
	if (!this.CheckupAppointement(controller))
		return;
	var subject=this.GetAppointementSubject(controller);
	zimletInstance._dialog = new ZmDialog({
		title : zimletInstance.getMessage('StartMeetingZimlet_label'),
		parent : this.getShell(),
		standardButtons : [DwtDialog.OK_BUTTON, DwtDialog.CANCEL_BUTTON],
		disposeOnPopDown : true
	});

	//
	// Encodage du sujet pour ne pas "casser" le document si editor html
	var temp=subject.encodeHTML();
	var dataTemplate = {subject: temp,image:zimletInstance.getResource("lifesize.png")};
	var html;
	
	if (controller._composeView.getHtmlEditor().getContent().trim().length>0)
		html=AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#warning_confirme_create_visio", dataTemplate);
	else
		html=AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#confirme_create_visio", dataTemplate);
	
	zimletInstance._dialog.setContent(html);
	

	zimletInstance._dialog.setButtonListener(DwtDialog.OK_BUTTON,
			new AjxListener(zimletInstance, this.AddStartMeetingLinkHandler,
					[controller]));
	zimletInstance._dialog.setButtonListener(DwtDialog.CANCEL_BUTTON,
			new AjxListener(zimletInstance, zimletInstance.CancelBtn));
	document.getElementById(zimletInstance._dialog.__internalId + '_handle').style.backgroundColor = '#eeeeee';
	document.getElementById(zimletInstance._dialog.__internalId + '_title').style.textAlign = 'center';

	zimletInstance._dialog.popup();
};
/**
 * This method is called when the dialog "CANCEL" button is clicked. It
 * pops-down the current dialog.
 */
StartMeeting.prototype.CancelBtn = function() {
	var zimletInstance = appCtxt._zimletMgr
			.getZimletByName('fr_cd21_startmeeting').handlerObject;
	try {
		zimletInstance._dialog.setContent('');
		zimletInstance._dialog.popdown();
	} catch (err) {
	}
};


/** 
 * Création de l'objet avec les paramètres de création d'une salle virtuelle
 */
StartMeeting.prototype.CreateMeetingRequest = function(controller, access_pin) {
	var meetingParams={
		ownerExtension:StartMeeting.lifeSizeUserExtension,
		
		// Formatage du libellé qui apparaitra dans l'interface web lifesizecloud.com
		// NomCréateurVisio sujet (Demandeur)
		displayName: this.Format("{0} {1} ({2})",
			StartMeeting.lifeSizeMeetingOwner,
			this.GetAppointementSubject(controller,"pas de sujet"),
			StartMeeting.fullname),     
			
		description: this.GetAppointementSubject(controller,"pas de sujet"),
		tempMeeting: StartMeeting.lifeSizeTempMeeting.toString(),     
		hiddenMeeting: StartMeeting.lifeSizeHiddenMeeting.toString(),
		pin:access_pin
	}
	return meetingParams;
}
/**
*
* Renvoie la date et l'heure de début du rendez-vous courrant
*/
StartMeeting.prototype.GetAppointementDateStart = function(controller, fullDate) {
	var timeRange = "";
	// Toute la journée
	if (fullDate && !controller._composeView._apptEditView._allDayCheckbox.checked) {
		timeRange = " "+this.Format("{0}/{1}",
				controller._composeView._apptEditView._startTimeSelect
						.getTimeString(),
				controller._composeView._apptEditView._endTimeSelect
						.getTimeString());
	}
	var dateStart=controller._composeView._apptEditView._startDateField.value+timeRange;
	return dateStart;
}

/**
 * Création d'un code d'accès basé sur la date du jour de la réunion
 */
StartMeeting.prototype.GetAppointementAccessPin = function(controller) {
	var dateStart=controller._composeView._apptEditView.getScheduleView()._getStartDate();
	var access_pin = this.CreateAccessPin(dateStart);
	return access_pin;
}

/**
*
* Renvoie la date et l'heure de début du rendez-vous courrant
*/
StartMeeting.prototype.GetAppointementDateStart = function(controller, fullDate) {
	var timeRange = "";
	// Toute la journée
	if (fullDate && !controller._composeView._apptEditView._allDayCheckbox.checked) {
		timeRange = " "+this.Format("{0}/{1}",
				controller._composeView._apptEditView._startTimeSelect
						.getTimeString(),
				controller._composeView._apptEditView._endTimeSelect
						.getTimeString());
	}
	var dateStart=controller._composeView._apptEditView._startDateField.value+timeRange;
	return dateStart;
}
/**
*
* Renvoie le sujet du rendez-vous courrant ou la valeur par defaut
*
*/
StartMeeting.prototype.GetAppointementSubject = function(controller, defaultSubject) {
	var subject = controller._composeView._apptEditView._subjectField.getValue();
	if (!subject || subject.length==0 || subject.trim().length==0)
		subject=defaultSubject;
	// ._apptEditView._subjectField.getValue()
	return subject;
}
/**
 * Coupure d'une chaine sur le 1er mot au dela de la taille maximum souhaitée
 * value la chaine à couper
 * max la taille maximum
 */
StartMeeting.prototype.TruncToWord = function(value, max) {
	if (value.length>max) {
		var blank=value.lastIndexOf(" ");
		value=value.substring(0,Math.max(max,blank))+"...";
	}
	return value;
}

/**
 * Génération d'un code d'accès basé sur une date
 */
StartMeeting.prototype.CreateAccessPin = function(dateMeeting) {
	if (!dateMeeting)
		dateMeeting = new Date();
	var dd = String(dateMeeting.getDate());
	if (dd.length<2) dd="0"+dd;
	var mm = String(dateMeeting.getMonth() + 1); //January is 0!
	if (mm.length<2) mm="0"+mm;
	var yy = String(dateMeeting.getFullYear()).substring(2);
	return yy+mm+dd;
}

/**
 * Création d'un objet avec les paramètres de connexion en retour, d'une salle virtuelle
 * @param controller le controlleur en cours
 * @param room le code de la salle ou null (code de "simulation")
 * @param pin le code d'accès ou null (création du code d'accès)
 */
StartMeeting.prototype.GetDataTemplateStartMeeting = function(controller,room, pin) {
	var access_pin = pin || this.GetAppointementAccessPin(controller);
	var dateStart = this.GetAppointementDateStart(controller);
	var subject= this.TruncToWord(this.GetAppointementSubject(controller,"pas de sujet"),64);
	
	return {
		host:StartMeeting.ConnectURL,
		skypehost:StartMeeting.ConnectSkypeURL,
		room: room || "-----simulation----",
		telephone:StartMeeting.ConnectAudio,
		subject:subject,
		pin:access_pin,
		date:dateStart,
		name:StartMeeting.userName
	};
}
/**
 * Envoie d'une requête aau serveur Lifesize et mise à jour du message avec les
 * identifiants de connexions
 * 
 * @param {ZmCalController}
 *            controller the Zimbra calendar controller
 */
StartMeeting.prototype.AddStartMeetingLinkHandler = function(controller) {
	
	
	var zimletInstance = appCtxt._zimletMgr
			.getZimletByName('fr_cd21_startmeeting').handlerObject;
	
	var json=this.CreateMeetingRequest(controller,this.GetAppointementAccessPin(controller));	
	var request = '/service/proxy?target=' + StartMeeting.URL;
	this.debug(AjxDebug.DBG1,
			"StartMeeting.AddStartMeetingLinkHandler lifesize request : "
					+ request);
	this.debug(AjxDebug.DBG1,
			"StartMeeting.AddStartMeetingLinkHandler lifesize json body : "
					+ JSON.stringify(json));
	
	
	if (this.IsSimulation()) {
		var dataTemplate = this.GetDataTemplateStartMeeting(controller);
		var html = AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#startmeeting", dataTemplate);
		controller._composeView.getHtmlEditor().setContent(html);
		this.CancelBtn();
		result = AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message7", {param1:"(simulcation) "});
				this.MessageDialog(result);
		return;
	}
	
	// Close de popup dialogue
	this.CancelBtn();
		
	var xhr = new XMLHttpRequest();
	var result="";
	
	try {
		this.SetStatus(ZmMsg.loading, ZmStatusView.LEVEL_INFO);
		xhr.open("POST", request, true);
		// Pour IE, le timeout est définissable seulement après l'ouverture
		xhr.timeout=StartMeeting.lifeSizeTimeout;
		xhr.setRequestHeader('key', StartMeeting.lifeSizeMeetingAPIKey);
		xhr.setRequestHeader('Content-Type', 'application/json');

		xhr.send(JSON.stringify(json));
		
		xhr.onload = (function(oEvent) {
			var result;
			var response = JSON.parse(xhr.responseText);
			this.debug(AjxDebug.DBG1,
					"StartMeeting.AddStartMeetingLinkHandler : response = "
							+ xhr.responseText);
			if (response.statusCode == 202) {
				var dataTemplate = this.GetDataTemplateStartMeeting(controller,
																	response.body.extension,
																	response.body.pin);
			    if (this.IsEditorHTML(controller)) {
					result = AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#startmeeting", dataTemplate);
			    }
			    else  {
			    	result=AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#startmeeting_text", dataTemplate);
			    }
			    controller._composeView.getHtmlEditor().setContent(result);

				result = AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message7", {});
				this.MessageDialog(result);
			}
			else {
				var dataTemplate = {param1: "StartMeeting.AddStartMeetingLinkHandler",param2:response.statusCode,param3:xhr.responseText};
				result =  AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message1", dataTemplate);
				this.MessageDialog(result, DwtMessageDialog.CRITICAL_STYLE);
			}
			
		}).bind(this);
		
		xhr.ontimeout = (function(oEvent) {
			var dataTemplate = {param1: "StartMeeting.AddStartMeetingLinkHandler",param2:xhr.timeout};
			var result =  AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message2", dataTemplate);
			this.MessageDialog(result, DwtMessageDialog.CRITICAL_STYLE);
			
		}).bind(this);
		
		xhr.onerror = (function(oEvent) {
			var dataTemplate = {param1: "StartMeeting.AddStartMeetingLinkHandler",param2:xhr.status,param3:xhr.responseText};
			var result = AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#message3", dataTemplate);
			this.MessageDialog(result, DwtMessageDialog.CRITICAL_STYLE);
		}).bind(this);

	} catch (err) {
		var dataTemplate = {param1: "StartMeeting.AddStartMeetingLinkHandler",param2:err};
		var result = AjxTemplate.expand("fr_cd21_startmeeting.templates.Startmeeting#exception1", dataTemplate);
		this.ErrorDialog(result);
	}
		
};


