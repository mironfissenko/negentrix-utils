import defaultSettings from "./settings";
class Analytics {
    _formSubmitted = false;
    _mainPhone = null;
    _mainEmail = null;

    constructor(customSettings, language = 'RU') {
        if (!!Analytics.instance) {
            return Analytics.instance;
        }

        this.language = language;
        this.eventsTriggeredLast = new Set();
        this.settings = Object.assign(defaultSettings, customSettings);
        this.settings.hiddenFields.Preferred_Contact_Language.value = this.language;

        if (this.settings.platform === "webflow") {
            this.settings.hiddenFields.phone = { "value": "", "type": "text", };
        }

        Analytics.instance = this;

        return this;
    }

    static constructSendPulseLink (pulseValues, urlBase = "https://tg.pulse.is/", botName, pulseStart) {
        let link = urlBase + botName + "?start=" + pulseStart;

        Object.entries(pulseValues).forEach(([key, value]) => {
            link += `|${key}=${value}`;
        });

        return link;
    }

    insertHiddenFieldsInForms(hiddenFields) {
        const forms = this.forms;
        const fields = Object.entries(hiddenFields);
        forms.forEach(form => {
            fields.forEach(field => {
                const inputHTML = `<input type="${field[1].type}" id="${field[0]}" name="${field[0]}" value="${field[1].value}" style="display: none" />`;
                form.insertAdjacentHTML('beforeend', inputHTML);
            });
        })
    }

    _ensureErrorPopupDiv(popupSelector) {
        let errorPopup = document.getElementById(popupSelector);

        if (!errorPopup) {
            //TODO: оптимизировать код в зависимости от платформы
            errorPopup = document.createElement('div');
            errorPopup.id = popupSelector;
            let errorSubPopup = document.createElement("div");
            if (this.settings.platform === 'tilda') {
                errorPopup.className = "js-form-popup-errorbox tn-form__errorbox-popup";
                errorPopup.style.display = "none";
                errorSubPopup.className = "t-form__errorbox-text t-text t-text_xs";
            }

            if (this.settings.platform === 'webflow') {
                errorPopup.className = "js-form-popup-errorbox";
                errorPopup.style.display = "none";
                errorSubPopup.className = "popup_message";
            }

            errorSubPopup.style.display = "block";
            errorPopup.appendChild(errorSubPopup);

            document.body.appendChild(errorPopup);
            return errorSubPopup;
        }

        if (this.settings.platform === 'tilda') {
            return errorPopup.querySelector(".t-form__errorbox-text.t-text.t-text_xs");
        }

        if (this.settings.platform === 'webflow') {
            return errorPopup.querySelector(".popup_message");
        }
    }

    _showErrorMessage(type = "custom", animationTimeout = 5000) {
        let errorMessageContainer = this._ensureErrorPopupDiv(this.settings.popupSelector);
        if (!errorMessageContainer) {
            console.warn("container for errors not found.");
            return;
        }

        let errorText = this.settings.errorMap[type].message[this.language];

        let parentElement = errorMessageContainer.parentElement;
        errorMessageContainer.style.display = "block";
        parentElement.style.display = "block";

        let errorMessage = errorMessageContainer.querySelector('p');
        if (errorMessage) {
            errorMessage.style.display = "block";
        } else {
            errorMessage = document.createElement('p');
            errorMessage.id = "emEmail";
            errorMessage.className = "t-form__errorbox-item";
            errorMessage.style.display = "block";
            console.log("Error message created; type: " + type);
            errorMessageContainer.appendChild(errorMessage);
        }

        errorMessage.textContent = errorText;

        setTimeout(() => {
            errorMessage.style.display = "none";
            errorMessageContainer.style.display = "none";
            parentElement.style.display = "none";
        }, animationTimeout);

        console.warn(errorText);
    }

    _getAllCookies() {
        try {
            const cookiesObj = {};
            if (!document.cookie) return cookiesObj;

            const cookiePairs = document.cookie.split("; ");
            for (const pair of cookiePairs) {
                const [name, value = ""] = pair.split("=");
                cookiesObj[name] = decodeURIComponent(value);
            }
            return cookiesObj;
        } catch {
            console.error("Error occured: ", error);
            return {};
        }
    }

    _getCookiesAgreement(category = "analytics") {
        let allCookies = this._getAllCookies();
        const agreement = allCookies[this.settings.cookieAgreement];
        if (!agreement) return false;

        if (category === "analytics") {
            if (agreement.includes(category)) return true;
        }

        if (category === "advertising") {
            if (agreement.includes(category)) return true;
        }

        return false;
    }

    _inputInHiddenField(fieldName, fieldValue) {
        let fields = document.querySelectorAll(`input[name='${fieldName}']`);
        if (fields) {
            for (const field of fields) {
                field.value = fieldValue;
            }
        }
    }

    // Подумать, на какое событие тоже лучше было бы повесить этот метод
    _attachLastNameListener(form) {

        const lastNameField = form.querySelector('[name="email"]');

        lastNameField.addEventListener('change', async () => {
            if (!this._getCookiesAgreement()) { return; }
            try {
                this._getMarketingData();
                let gaClientId = '';
                let cookiesObj = this._getAllCookies();

                if (cookiesObj['_ga']) {
                    gaClientId = cookiesObj['_ga']
                }

                this._inputInHiddenField("ga_client_id", gaClientId);
                this._inputInHiddenField("first_source", localStorage.getItem('first_source'));
                this._inputInHiddenField("first_landing_page", localStorage.getItem('first_landing_page'));
                this._inputInHiddenField("first_medium", localStorage.getItem('first_medium'));
                this._inputInHiddenField("session_source_medium", localStorage.getItem('session_source_medium'));
                this._inputInHiddenField("Cookies", JSON.stringify(this._getAllCookies()));
                if (form.getAttribute("analyticsTriggered") == "false") {
                    const response = await fetch(`${this.settings.apiUrl}/visitor/analytics`);
                    if (!response.ok) {
                        throw new Error(`Network response was not ok (status ${response.status})`);
                    }
                    const data = await response.json();
                    console.log("Analytics recieved;");

                    this._inputInHiddenField("Client_Ip", data.clientIp);
                    this._inputInHiddenField("User_Agent", data.userAgent);
                    this._inputInHiddenField("Accept_Language", data.acceptLanguage);
                    this._inputInHiddenField("Ip_Region", data.ipRegion);
                    this._inputInHiddenField("Ip_Country", data.ipCountry);
                    this._inputInHiddenField("Ip_City", data.ipCity);
                    form.setAttribute("analyticsTriggered", "true");
                }
            } catch (err) {
                console.error('Fetch error:', err);
            }
        });
    }

    _phoneAssemble(form, platform = this.settings.platform) {
        let phoneNumber = "";
        let phoneMask = "";
        let phoneCode = "";

        if (platform === "tilda") {
            phoneMask = form.querySelector(".t-input-phonemask__select-flag").getAttribute("data-phonemask-flag").trim();
            phoneCode = form.querySelector(".t-input-phonemask__select-code").textContent.trim();
            phoneNumber = (phoneCode + form.querySelector('[name="tildaspec-phone-part[]"]').getAttribute("data-phonemask-current").trim()).replace("(", "").replace(")", "").replace(" ", "").replace("-", "");
            this._mainPhone = phoneNumber;
        }

        if (platform === "webflow" || platform === "wordpress") {
            phoneMask = form.querySelector(".iti__flag").getAttribute("class").trim().replace("iti__flag", "").replace("iti__", "").trim();
            phoneCode = form.querySelector(".iti__selected-dial-code").textContent.trim();
            phoneNumber = (form.querySelector('[name="phone"]').value.trim()).replace("(", "").replace(")", "").replace(" ", "").replace("-", "");
            this._mainPhone = phoneNumber
        }

        return {
            phoneNumber,
            phoneMask,
            phoneCode
        }
    }

    async _phoneValidation(form) {
        try {
            console.log("phoneValidation is triggered;");
            const phoneAssembled = this._phoneAssemble(form);

            if (this.settings.phoneValidation.enabled === false) { return true; }

            const requestData = {
                phone: phoneAssembled.phoneNumber,
                countryCodeIso: phoneAssembled.phoneMask
            };

            const response = await fetch(`${this.settings.apiUrl}/visitor/phone/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            console.log(response.body);

            if (response.status === 200) {
                const responseBody = await response.json();
                console.log("PhoneResponseBody: ", responseBody);

                if (responseBody.phoneType !== "INVALID") {
                    return true;
                } else {
                    this._showErrorMessage("phone_invalid");
                    return false;
                }
            }

        } catch (error) {
            console.error("Phone validation or request failed:", error);
            return true;
        }
    }

    _startButtonAnimation(form) {
        try {
            form.setAttribute("animation", "true");
            console.log("Animation started;");

            let subButton = form.querySelector(this.settings.subButtonAnimationSelector);
            const originalText = subButton.textContent;
            const frames = [
                ".",
                ". .",
                ". . ."
            ];
            let currentFrame = 0;

            const intervalId = setInterval(() => {
                if (form.getAttribute("animation") !== "true") {
                    clearInterval(intervalId);
                    subButton.textContent = originalText;
                    return;
                }

                console.log("Current text: ", subButton.textContent);

                subButton.textContent = frames[currentFrame];
                currentFrame = (currentFrame + 1) % frames.length;
            }, 400);
        } catch (error) {
            console.error("Error occured: ", error);
        }
    }

    _stopButtonAnimation(form) {
        form.setAttribute("animation", "false");
        console.log("Validation is not busy;");
    }

    _fuTilda(form) {
        try {
            form.querySelector("input[name='Privacy Agreement']").required = true;
        } catch (error) {
            console.error(error);
        }
    }

    _getMarketingData() {
        if (!this._getCookiesAgreement()) { return };
        let medium = this._getMedium();
        let source = this._getSource();

        localStorage.setItem('session_source_medium', source + ' / ' + medium);
        if (!document.cookie.split('; ').find(row => row.startsWith("isMarketingDataCollected" + '='))) {
            document.cookie = 'isMarketingDataCollected=true';

            localStorage.setItem('first_medium', this._getMedium());
            localStorage.setItem('first_source', this._getSource());
            localStorage.setItem('first_landing_page', window.location.href);
        }
    }

    _getMedium() {
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = document.referrer;
        let medium = 'direct';

        if (urlParams.has('utm_medium')) {
            medium = urlParams.get('utm_medium');
        } else if (referrer) {
            const refHost = new URL(referrer).hostname;
            const isSelfReferral = refHost === window.location.hostname;

            if (!isSelfReferral) {
                const searchEngines = ['google', 'yandex', 'bing', 'duckduckgo', 'yahoo'];
                const isSearch = searchEngines.some(engine => refHost.includes(engine));
                medium = isSearch ? 'organic' : 'referral';
            } else if (navigator.userAgent.includes('Instagram')) {
                medium = 'referral';
            }
        } else if (navigator.userAgent.includes('Instagram')) {
            medium = 'referral';
        }

        return medium;
    }

    _getSource() {
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = document.referrer;

        if (urlParams.has('utm_source')) return urlParams.get('utm_source');

        if (referrer) {
            const refHost = new URL(referrer).hostname;
            if (refHost !== window.location.hostname) {
                return refHost;
            }
        }

        if (navigator.userAgent.includes('Instagram')) {
            return 'instagram.com';
        }

        return 'direct';
    }

    getForms() {
        try {
            let initForms = document.querySelectorAll('form');
            const resForms = [];

            for (const form of initForms) {
                const flag = (form.querySelector('input[name="email"]') !== null) && ((form.querySelector('input[name="phone" i]') !== null) || (form.querySelector('input[name="phone-visible"]') !== null));
                if (flag) {
                    resForms.push(form);
                }
            }

            console.log("Forms on the webpage: ", resForms.length);
            return resForms;

        } catch (e) {
            console.log("Error at getForms: ", e);
            return [];
        }
    }

    lastNameHelper(forms) {
        for (let form of forms) {
            this._attachLastNameListener(form);
            form.setAttribute("analyticsTriggered", "false");
        }
    }

    _validateFields(form, fieldsObject = this.settings.validateFields) {
        const fields = Object.entries(fieldsObject);

        for (const [name, config] of fields) {
            const fieldEl = form.querySelector(`[name="${name}"]`);

            if (!fieldEl) continue;

            const fieldValue = fieldEl.value.trim();

            if (!fieldValue) {
                this._showErrorMessage(config.error_type[0]);
                this._stopButtonAnimation(form);
                return false;
            }

            if (!fieldEl.checkValidity()) {
                this._showErrorMessage(config.error_type[1]);
                this._stopButtonAnimation(form);
                return false;
            }
        }

        return true;
    }

    // этот метод отвечает за работу отправки событий для мета
    _googleTagSendLogic() {
        if (this.settings.googleTagSend.method === "thankYouPage") {
            if (this.settings.googleTagSend.isSendPulseLink) {
                sessionStorage.setItem("phone_number", this._mainPhone);
                sessionStorage.setItem("email", this._mainEmail);
            }
            window.location.href = this.settings.googleTagSend.thankYouPageUrl;
        } else if (this.settings.googleTagSend.method === "dataLayerPush") {
            dataLayer.push({
                'event': this.settings.googleTagSend.event,
            });
        } else {
            console.warn("No dataLayer push or any analytics logic");
        }
    }

    subValidation(forms) {
        //TODO: конкретно тут может быть проблема с safari, так как subValidation запускается сразу после инициализации объекта класса
        try {
            console.log("subValidation was called;");

            for (const form of forms) {
                if (this.settings.platform === 'tilda') {
                    this._fuTilda(form);
                }
                let subButton = form.querySelector(this.settings.subButtonAnimationSelector);

                let subButtonContainer = subButton.parentElement;
                subButtonContainer.style.cursor = "pointer";

                subButton.setAttribute('inert', "disabled");
                form.setAttribute("animation", "false");

                subButtonContainer.addEventListener("click", async () => {
                    if (form.getAttribute("animation") == "false") {
                        if (!this._validateFields(form)) {
                            return false;
                        }

                        const emailField = form.querySelector('input[name="email"]');
                        this._mainEmail = emailField.value;

                        if (!form.checkValidity()) {
                            form.reportValidity();
                            this._showErrorMessage("required_fields_missing");
                            this._stopButtonAnimation(form);
                            return false;
                        }

                        this._formSubmitted = true;

                        this._startButtonAnimation(form);
                        let validationResult = await this._phoneValidation(form);

                        console.log("Validation: ", validationResult);
                        if (validationResult && this._formSubmitted) {
                            subButton.setAttribute('inert', "enabled");
                            this.tgLinks.forEach(link => {
                                if (link && link != null){
                                    link.href = Analytics.constructSendPulseLink({"phone_number": this._mainPhone, "email": this._mainEmail}, "https://tg.pulse.is/", this.settings.tgBotName, this.settings.tgSendPulseStart);
                                }
                            });
                            this._formSubmitted = true;
                            form.requestSubmit(form.querySelector(this.settings.subButtonAnimationSelector));
                            subButton.setAttribute('inert', "disabled");
                            setTimeout(() => {
                                this._formSubmitted = false;
                                this._googleTagSendLogic();
                            }, 2000);
                        } else {
                            this._showErrorMessage("phone_invalid");
                        }
                        this._stopButtonAnimation(form);
                        console.log("stopButtonAnimation was called;");
                    }

                    console.log("stopButtonAnimation was called;");
                    this._stopButtonAnimation(form);
                })
            }
        } catch (error) {
            console.error("Submition validation failed: ", error);

            const forms = this.getForms();
            for (const form of forms) {
                let subButton = form.querySelector(this.settings.subButtonAnimationSelector);
                subButton.setAttribute('inert', "enabled");
                form.requestSubmit(form.querySelector(this.settings.subButtonAnimationSelector));
                console.log("stopButtonAnimation was called;");
                this._stopButtonAnimation(form);
            }
        }
    }

    _init() {
        this.forms = this.getForms();
        this.tgLinks = document.querySelectorAll(`a[href="${this.settings.tgBaseLink}"]`);
        this._getMarketingData();
        this.insertHiddenFieldsInForms(this.settings.hiddenFields);

        //TODO: вынести в отдельную функцию, сборку номера для валидации осуществить через iti
        if (this.settings.platform === 'webflow') {
            this.forms.forEach(form => {
                const phoneVisible = form.querySelector('input[name="phone-visible"]');
                const phone = form.querySelector('input[name="phone"]');
                const iti = window.intlTelInput(phoneVisible, {
                    initialCountry: "de",
                    dropdownContainer: document.body,
                    loadUtils: () => import(
                        /* webpackIgnore: true */
                        "https://cdn.jsdelivr.net/npm/intl-tel-input@28.0.4/dist/js/utils.js"
                        ),
                });

                iti.promise.then(() => {
                    const syncPhoneNumber = () => {
                        if (iti.isValidNumber()) {
                            phone.value = iti.getNumber();
                        } else {
                            phone.value = "";
                        }
                    };

                    phoneVisible.addEventListener("input", syncPhoneNumber);
                    phoneVisible.addEventListener("countrychange", syncPhoneNumber);

                }).catch((error) => {
                    console.error("Ошибка загрузки утилит intl-tel-input в форме:", error);
                });
            });
        }
        this.lastNameHelper(this.forms);
        this.subValidation(this.forms);
    }

    initAfterAllEvents(eventName) {
        console.log(eventName);
        this.eventsTriggeredLast.add(eventName);

        if (
            this.eventsTriggeredLast.has("DOMContentLoaded") &&
            this.eventsTriggeredLast.has("pageshow") &&
            this.eventsTriggeredLast.has("load")
        ) {
            console.log("All events happened; waiting 100ms");
            setTimeout(() => {
                this._init();
            }, 100);
        }
    }
}

export default Analytics;
