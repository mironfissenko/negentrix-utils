export default {
    "popupSelector": "tilda-popup-for-error",
    "tgBaseLink": "https://t.me/ICHBuddyBot",
    "tgBotName": "ICHBuddyBot",
    "tgSendPulseStart": "682c86d992037dea7e02af12",
    "cookieAgreement": "t_cookiesCategories",
    "phoneValidation": {
        "enabled": true,
    },
    "tgPulseValues": {
        "phone_number": "",
        "email": "",
    },
    "platform": "tilda",
    "company": "ICH",
    "subButtonAnimationSelector": "[type='submit']",
    "apiUrl": "https://api.int.negentrix.com",
    "googleTagSend": {
        "method": "dataLayerPush",
        "isSendPulseLink": true,
        "event": "submit_form",
        "thankYouPageUrl": "/thank-you"
    },
    "errorMap": {
        "email_missing": {
            "message": {
                "RU": "Пожалуйста, заполните email",
                "EN": "Please fill in Email",
                "DE": "Bitte E-Mail ausfüllen",
                "UA": "Будь ласка, введіть email"
            }
        },
        "email_invalid": {
            "message": {
                "RU": "Неверный email",
                "EN": "Email is invalid",
                "DE": "E-Mail ist ungültig",
                "UA": "Невірний email"
            }
        },
        "phone_missing": {
            "message": {
                "RU": "Пожалуйста, заполните телефон",
                "EN": "Please fill in Phone Number",
                "DE": "Bitte geben Sie Ihre Telefonnummer ein",
                "UA": "Будь ласка, введіть номер телефону"
            }
        },
        "phone_invalid": {
            "message": {
                "RU": "Неверный номер телефона",
                "EN": "Phone number is invalid",
                "DE": "Telefonnummer ist ungültig",
                "UA": "Невірний номер телефону"
            }
        },
        "name_surname_missing": {
            "message": {
                "RU": "Пожалуйста, укажите свое имя и фамилию",
                "EN": "Please fill your Name and Surname",
                "DE": "Bitte geben Sie Ihren Vor- und Nachnamen ein",
                "UA": "Будь ласка, вкажіть своє ім'я та прізвище"
            }
        },
        "required_fields_missing": {
            "message": {
                "RU": "Пожалуйста, заполните все обязательные поля",
                "EN": "Please fill in all required fields",
                "DE": "Bitte füllen Sie alle erforderlichen Felder aus",
                "UA": "Будь ласка, заповніть всі обов'язкові поля"
            }
        },
        "custom": {
            "message": {
                "RU": "При заполнении формы произошла ошибка",
                "EN": "An error occurred when filling out the form",
                "DE": "Beim Ausfüllen des Formulars ist ein Fehler aufgetreten",
                "UA": "Під час заповнення форми сталася помилка"
            }
        }
    },
    "hiddenFields": {
        "User_Agent": { "value": "", "type": "text", },
        "Accept_Language": { "value": "", "type": "text", },
        "Ip_Region": { "value": "", "type": "text", },
        "Ip_Country": { "value": "", "type": "text", },
        "Ip_City": { "value": "", "type": "text", },
        "Cookies": { "value": "", "type": "text", },
        "Client_Ip": { "value": "", "type": "text", },
        "Preferred_Contact_Language": { "value": "RU", "type": "text",},
        "Preferred_Product": { "value": "General", "type": "text", },
        "Newsletter_Agreement_Text": { "value": "Ich stimme dem Erhalt von Informationen und Angeboten der Negentrix Education Group (ICH, DWW, BIT, MBIA, AABI u.a.) zu. Eine Abmeldung ist jederzeit möglich.", "type": "text", },
        "Privacy_Agreement_Id": { "value": "", "type": "text", },
        "ga_client_id": { "value": "","type": "text", },
        "first_source": { "value": "", "type": "text", },
        "first_landing_page": { "value": "", "type": "text", },
        "first_medium": { "value": "", "type": "text", },
        "session_source_medium": { "value": "", "type": "text", },
    },
    "validateFields": {
        "name" : { "error_type": ["name_surname_missing", "custom"] },
        "last name" : { "error_type": ["name_surname_missing", "custom"] },
        "email" : { "error_type": ["email_missing", "email_invalid"] },
        "phone" : { "error_type": ["phone_missing", "custom"] },
    }
}