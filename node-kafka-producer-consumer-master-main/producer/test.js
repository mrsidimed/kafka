

var tab1 = [
	"404",
	"Algeria",
	"Angola",
	"Bahrain",
	"Bangladesh",
	"Belgium",
	"Benin",
	"Brazil",
	"Bulgaria",
	"Cameroon",
	"Canada",
	"China",
	"Cyprus",
	"Czech Republic",
	"Côte d'Ivoire",
	"Denmark",
	"Egypt",
	"Equatorial Guinea",
	"Ethiopia",
	"Finland",
	"France",
	"Gabon",
	"Gambia",
	"Germany",
	"Greece",
	"Guinea",
	"Guinea-Bissau",
	"Hong Kong",
	"Hungary",
	"India",
	"Iran",
	"Ireland",
	"Israel",
	"Italy",
	"Ivory Coast",
	"Japan",
	"Kazakhstan",
	"Kuwait",
	"Kyrgyzstan",
	"Latvia",
	"Libya",
	"Mali",
	"Mauritania",
	"Morocco",
	"Mozambique",
	"Netherlands",
	"Niger",
	"Nigeria",
	"Portugal",
	"Qatar",
	"Republic of Korea",
	"Republic of Lithuania",
	"Republic of Moldova",
	"Republic of the Congo",
	"Russia",
	"Rwanda",
	"Saudi Arabia",
	"Senegal",
	"Singapore",
	"Slovak Republic",
	"Somalia",
	"South Africa",
	"Spain",
	"Sudan",
	"Sweden",
	"Switzerland",
	"Tunisia",
	"Turkey",
	"Ukraine",
	"United Arab Emirates",
	"United Kingdom",
	"United States",
	"Yemen"
]

var tab2 = [
	"404",
	"Algeria",
	"Angola",
	"Bangladesh",
	"Belgium",
	"Benin",
	"Brazil",
	"Bulgaria",
	"Cameroon",
	"Canada",
	"China",
	"Cyprus",
	"Czech Republic",
	"Côte d'Ivoire",
	"Denmark",
	"Egypt",
	"Equatorial Guinea",
	"Ethiopia",
	"Finland",
	"France",
	"Gabon",
	"Gambia",
	"Germany",
	"Greece",
	"Guinea",
	"Guinea-Bissau",
	"Hong Kong",
	"Hungary",
	"India",
	"Iran",
	"Ireland",
	"Israel",
	"Italy",
	"Ivory Coast",
	"Japan",
	"Kazakhstan",
	"Kuwait",
	"Kyrgyzstan",
	"Latvia",
	"Libya",
	"Mali",
	"Mauritania",
	"Morocco",
	"Mozambique",
	"Netherlands",
	"Niger",
	"Nigeria",
	"Portugal",
	"Qatar",
	"Republic of Lithuania",
	"Republic of Moldova",
	"Republic of the Congo",
	"Russia",
	"Rwanda",
	"Saudi Arabia",
	"Senegal",
	"Singapore",
	"Slovak Republic",
	"Somalia",
	"South Africa",
	"Spain",
	"Sudan",
	"Sweden",
	"Switzerland",
	"Tunisia",
	"Turkey",
	"Ukraine",
	"United Arab Emirates",
	"United Kingdom",
	"United States",
	"Yemen"
]


let difference = tab1.filter(x => !tab2.includes(x));
console.log('difference '+difference);