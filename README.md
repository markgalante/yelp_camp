# Yelp Camp

This is a website created during [Colt Steele's The Web Development Bootcamp on Udemy](https://www.udemy.com/course/the-web-developer-bootcamp/). It gives users an opportunity to rate campsites. 

## Getting Started: 
> This application contains API keys and passwords that has not been included on this repository. In order to run this application, you'll need to create a .env file with your neccessary details. 

### Clone this repository: 
```
-- git clone https://github.com/markgalante/yelp_camp.git
```

### Install dependencies:
For npm: 
```
-- npm install
``` 

For yarn: 
```
-- yarn install
``` 

### .env set up: 
```
#Database: 
DATABASE_URL= <String>

#Cloudinary:  
CLOUDNAME= <String>
API_KEY= <Number>
API_SECRET= <String>

#Nodemailer: 
GMAIL= <String> e.g.: account@gmail.com
GM_PW= <String>
```

## Set-up of project: 

### Authentication and Authorisation: 
* Username and password authentication with [Passport.js](http://www.passportjs.org/)
* Password reset for forgotten password: password reset link generated with [Crypto](https://nodejs.org/api/crypto.html) and sent with [Nodemailer](https://nodemailer.com/about/). 

### Front-End 
* HTML with embedded JavaScript [ejs](https://ejs.co/)
* Styling with [Bootstrap 4](https://getbootstrap.com/)

### Photo Storage 
* Photos stored and referenced from [Cloudinary](https://cloudinary.com/)

### Backend 
* Web framework: [Express.js](https://expressjs.com/)
* Preventing script writing in input fields with [Express-Sanitizer](https://www.npmjs.com/package/express-sanitizer)
* Allowing file upload with [Method-Override](https://www.npmjs.com/package/method-override)
* [Moment.js](https://momentjs.com/docs/) to track time. 
* Alerts with [Connect-Flash](https://www.npmjs.com/package/connect-flash)
* Allowing for put and delete requests on HTML forms with [method-override](https://github.com/expressjs/method-override#method-override)

### Database
* Database: [MongoDB](https://www.mongodb.com/)
* Application data modelling with [Mongoose.js](https://mongoosejs.com/)

## License
#### [MIT](./LICENSE)