-- Adminer 4.8.1 MySQL 5.1.54-community-log dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';


CREATE DATABASE IF NOT EXISTS quittances;
USE quittances;












DROP TABLE IF EXISTS `cac`;
CREATE TABLE `cac` (
  `cac` varchar(6) COLLATE utf8_bin NOT NULL,
  `ncod_c` varchar(6) COLLATE utf8_bin NOT NULL,
  `nom_cac` varchar(30) COLLATE utf8_bin NOT NULL,
  `nom_cacar` varchar(30) COLLATE utf8_bin NOT NULL,
  `WILAMOU` varchar(3) COLLATE utf8_bin NOT NULL,
  `codecac` varchar(4) COLLATE utf8_bin NOT NULL,
  `devise` varchar(10) CHARACTER SET utf8 NOT NULL DEFAULT 'MRO',
  PRIMARY KEY (`cac`),
  KEY `ncod_c` (`ncod_c`,`nom_cac`),
  KEY `WILAMOU` (`WILAMOU`),
  KEY `codecac` (`codecac`),
  KEY `devise` (`devise`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

INSERT INTO `cac` (`cac`, `ncod_c`, `nom_cac`, `nom_cacar`, `WILAMOU`, `codecac`, `devise`) VALUES
('000008',	'000008',	'Jeddah',	'جده',	'000',	'0001',	'Riyal'),
('000012',	'000012',	'Qatar',	'قطر',	'000',	'0012',	'RQ'),
('000013',	'000013',	'Angola',	'أنغولا',	'000',	'0013',	'KZ'),
('000014',	'000014',	'Mali',	'مالي',	'000',	'0014',	'FCFA'),
('000015',	'000015',	'Koweit',	'الكويت',	'000',	'0015',	'DN'),
('000018',	'000018',	'Bruxell',	'بروكسل',	'000',	'0008',	'euro'),
('000046',	'000046',	'Abidjan',	'آبدجان',	'000',	'0003',	'CFA'),
('000054',	'000054',	'Abu Dhabi',	'ابو ظبي',	'000',	'0006',	'derhem'),
('000057',	'000057',	'Madrid',	'مدريد',	'000',	'0009',	'euro'),
('000059',	'000059',	'Washington',	'واشنطن',	'000',	'0010',	'dollar');

DROP TABLE IF EXISTS `ordres`;
CREATE TABLE `ordres` (
  `NUMERO` varchar(20) NOT NULL,
  `DATEORDRE` varchar(30) NOT NULL,
  `CODECAC` varchar(6) NOT NULL,
  `LOGIN` varchar(30) NOT NULL,
  `TYPEDOC` varchar(30) NOT NULL,
  `TYPEDEM` varchar(30) NOT NULL,
  `MONTANT` decimal(11,4) NOT NULL,
  `NNI` varchar(10) NOT NULL,
  `PRENOM_FR` varchar(100) NOT NULL,
  `PRENOM_PERE_FR` varchar(100) NOT NULL,
  `NOM_FAMILLE_FR` varchar(100) NOT NULL,
  `PRENOM_AR` varchar(100) NOT NULL,
  `PRENOM_PERE_AR` varchar(100) NOT NULL,
  `NOM_FAMILLE_AR` varchar(100) NOT NULL,
  `DATE_NAISSANCE` varchar(30) DEFAULT NULL,
  `LIEU_NAISSANCE_FR` varchar(100) DEFAULT NULL,
  `LIEU_NAISSANCE_AR` varchar(100) DEFAULT NULL,
  `PROFESSION_FR` varchar(100) DEFAULT NULL,
  `PROFESSION_AR` varchar(100) DEFAULT NULL,
  `TYPE_PERSONNE` varchar(1) NOT NULL,
  `TRANSPORT` decimal(11,4) NOT NULL,
  `devise` varchar(20) NOT NULL,
  `acquite` tinyint(1) NOT NULL DEFAULT '0',
  `reprise` int(1) NOT NULL DEFAULT '0',
  `Nrecette` varchar(17) DEFAULT NULL,
  `sent` tinyint(4) NOT NULL DEFAULT '0',
  `tel` varchar(20) NOT NULL,
  PRIMARY KEY (`NUMERO`),
  KEY `clef` (`CODECAC`,`NNI`,`TYPEDOC`,`TYPEDEM`),
  KEY `Nrecette` (`Nrecette`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

INSERT INTO `ordres` (`NUMERO`, `DATEORDRE`, `CODECAC`, `LOGIN`, `TYPEDOC`, `TYPEDEM`, `MONTANT`, `NNI`, `PRENOM_FR`, `PRENOM_PERE_FR`, `NOM_FAMILLE_FR`, `PRENOM_AR`, `PRENOM_PERE_AR`, `NOM_FAMILLE_AR`, `DATE_NAISSANCE`, `LIEU_NAISSANCE_FR`, `LIEU_NAISSANCE_AR`, `PROFESSION_FR`, `PROFESSION_AR`, `TYPE_PERSONNE`, `TRANSPORT`, `devise`, `acquite`, `reprise`, `Nrecette`, `sent`, `tel`) VALUES
('060401511120007',	'2018-09-26 08:27:21',	'000012',	'MedMoussa',	'5',	'1',	100.0000,	'0377186150',	'Khadijetou',	'Mohamed',	'Ramdhane',	'خديجة',	'محمد',	'رمظان',	'29/10/1996',	'Tekane',	'انتيكان',	'Sans Profession',	'بدون مهنة',	'C',	0.0000,	'MRO',	1,	0,	'06040120180927001',	1,	''),
('130202611120005',	'2018-09-26 07:49:33',	'000012',	'MAnne',	'6',	'1',	3000.0000,	'2757597966',	'Saidou',	'Abdellahi',	'Traoré',	'صيدو',	'عبد الله',	'اتراورى',	'19/12/1993',	'Sélibaby',	'سيلبابي',	'Elève',	'تلميذ',	'C',	0.0000,	'MRO',	2,	0,	NULL,	1,	''),
('060401511120006',	'2018-09-26 08:26:21',	'000012',	'MedMoussa',	'5',	'1',	100.0000,	'3337510817',	'Aïchetou',	'Mohamed',	'Ramdhane',	'عيشة',	'محمد',	'رمظان',	'11/08/1999',	'Tekane',	'انتيكان',	'Elève',	'تلميذة',	'C',	0.0000,	'MRO',	1,	0,	'06040120180927001',	1,	''),
('130202661120008',	'2018-09-26 08:30:27',	'000012',	'MAnne',	'6',	'6',	3000.0000,	'4465854393',	'Chivaa',	'Elbou',	'El Houssein',	'إشفاء',	'الب',	'الحسين',	'31/12/1972',	'Nouadhibou',	'انواذيبو',	'---',	'---',	'C',	0.0000,	'MRO',	2,	0,	NULL,	1,	''),
('130202611120009',	'2018-09-26 08:33:15',	'000012',	'MAnne',	'6',	'1',	3000.0000,	'7895043304',	'Mohamed Aly',	'Sidi',	'Senousi',	'محمدعال',	'سيدي',	'السنوسى',	'05/12/1995',	'Sebkha',	'السبخة',	'Sans Profession',	'بدون مهنة',	'C',	0.0000,	'MRO',	2,	0,	NULL,	1,	''),
('130202651120010',	'2018-09-26 08:34:38',	'000012',	'MAnne',	'6',	'5',	3000.0000,	'4465854393',	'Chivaa',	'Elbou',	'El Houssein',	'إشفاء',	'الب',	'الحسين',	'31/12/1972',	'Nouadhibou',	'انواذيبو',	'---',	'---',	'C',	0.0000,	'MRO',	2,	0,	NULL,	1,	''),
('130202511120011',	'2018-09-26 08:36:17',	'000012',	'MAnne',	'5',	'1',	100.0000,	'8060280670',	'Talla',	'Cheikh Tidjane',	'M\'Bodj',	'تالا',	'الشيخ التجان',	'امبودج',	'2002-09-03',	'Sebkha',	'السبخة',	'Sans Profession',	'بدون مهنة',	'C',	0.0000,	'MRO',	1,	0,	'13020220181001003',	1,	''),
('130808611120012',	'2018-09-26 08:37:37',	'000012',	'mokhtar',	'6',	'1',	3000.0000,	'1943114574',	'Worghiya',	'Idrissa',	'Diallo',	'ورقيه',	'ادريس',	'جالو',	'27/11/2015',	'Nouadhibou',	'انواذيبو',	'Sans Profession',	'بدون مهنة',	'C',	0.0000,	'MRO',	2,	0,	NULL,	1,	''),
('130202511120013',	'2018-09-26 08:39:03',	'000012',	'MAnne',	'5',	'1',	100.0000,	'1360914657',	'Oumar',	'Abdou',	'Gaye',	'عمر',	'عبدو',	'كاي',	'03/10/2006',	'N\'Diago',	'انجاكو',	'Elève',	'تلميذ',	'C',	0.0000,	'MRO',	1,	0,	'13020220181001003',	1,	''),
('130808611120014',	'2018-09-26 08:39:03',	'000012',	'mokhtar',	'6',	'1',	3000.0000,	'5067931162',	'Lassana',	'Idrissa',	'Diallo',	'لاصن',	'ادريس',	'جالو',	'2011-01-26',	'Djewol',	'جول',	'Sans Profession',	'بدون مهنة',	'C',	0.0000,	'MRO',	2,	0,	NULL,	1,	'');

DROP TABLE IF EXISTS `recettes`;
CREATE TABLE `recettes` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `Wilaya` varchar(30) COLLATE utf8_bin DEFAULT NULL,
  `Moughataa` varchar(30) COLLATE utf8_bin DEFAULT NULL,
  `Commune` varchar(30) COLLATE utf8_bin DEFAULT NULL,
  `Cac` varchar(30) COLLATE utf8_bin DEFAULT NULL,
  `Orde_recette` varchar(17) COLLATE utf8_bin DEFAULT NULL,
  `Quittance` varchar(20) COLLATE utf8_bin DEFAULT NULL,
  `Nature_encaiss` varchar(25) COLLATE utf8_bin DEFAULT NULL,
  `Montant` decimal(20,4) DEFAULT NULL,
  `date_quittance` datetime DEFAULT NULL,
  `lot` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `image` blob,
  `date_saisie` datetime NOT NULL,
  `etat` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `date_validation` date DEFAULT NULL,
  `nni` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `Debutb` int(11) DEFAULT NULL,
  `finb` int(11) DEFAULT NULL,
  `path` varchar(500) CHARACTER SET utf8 DEFAULT NULL,
  `MontantTrans` decimal(20,4) NOT NULL,
  `reference` varchar(70) COLLATE utf8_bin NOT NULL,
  `serviceBancaire` varchar(30) COLLATE utf8_bin NOT NULL,
  `idTransaction` varchar(70) COLLATE utf8_bin NOT NULL,
  `numeroTelephone` varchar(30) COLLATE utf8_bin NOT NULL,
  `paiement_en_ligne` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Quittance_2` (`Quittance`),
  KEY `date_saisie` (`date_saisie`),
  KEY `etat` (`etat`),
  KEY `date_validation` (`date_validation`),
  KEY `cedf` (`Cac`,`etat`,`Debutb`,`finb`),
  KEY `ordrerecette` (`Orde_recette`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

INSERT INTO `recettes` (`id`, `Wilaya`, `Moughataa`, `Commune`, `Cac`, `Orde_recette`, `Quittance`, `Nature_encaiss`, `Montant`, `date_quittance`, `lot`, `image`, `date_saisie`, `etat`, `date_validation`, `nni`, `Debutb`, `finb`, `path`, `MontantTrans`, `reference`, `serviceBancaire`, `idTransaction`, `numeroTelephone`, `paiement_en_ligne`) VALUES
(2,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312001',	'A00802296',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 15:37:17',	'Reçue',	'2014-04-02',	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00802296.tif',	0.0000,	'',	'',	'',	'',	0),
(3,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312002',	'A00794124',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 15:48:50',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794124.tif',	0.0000,	'',	'',	'',	'',	0),
(4,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312003',	'A00794150',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 15:52:39',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794150.tif',	0.0000,	'',	'',	'',	'',	0),
(5,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312004',	'A00794151',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 15:56:13',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794151.tif',	0.0000,	'',	'',	'',	'',	0),
(6,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312007',	'A00794065',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 16:03:11',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794065.tif',	0.0000,	'',	'',	'',	'',	0),
(7,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312008',	'A00794066',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 16:04:31',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794066.tif',	0.0000,	'',	'',	'',	'',	0),
(9,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312010',	'A00794067 ',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 16:06:14',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794067 .tif',	0.0000,	'',	'',	'',	'',	0),
(10,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312011',	'A00794070',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 16:07:47',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794070.tif',	0.0000,	'',	'',	'',	'',	0),
(11,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312012',	'A00794071',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 16:09:11',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794071.tif',	0.0000,	'',	'',	'',	'',	0),
(12,	'انواكشوط            ',	'السبخة                        ',	'السبخة',	'130225',	'13022520130312013',	'A00794072',	'CR ',	3000.0000,	'2013-03-12 00:00:00',	'',	'',	'2013-03-12 16:10:31',	'Reçue',	NULL,	'',	NULL,	NULL,	'recettes/130225/2013/03/1/A00794072.tif',	0.0000,	'',	'',	'',	'',	0);

DROP TABLE IF EXISTS `recettes_pdf`;
CREATE TABLE `recettes_pdf` (
  `Quittance` varchar(20) NOT NULL,
  `quittance_pdf` longtext,
  UNIQUE KEY `Quittance` (`Quittance`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

INSERT INTO `recettes_pdf` (`Quittance`, `quittance_pdf`) VALUES
('2022T000020000000003',	'JVBERi0xLjQKJeLjz9MKNiAwIG9iago8PC9Db2xvclNwYWNlL0RldmljZVJHQi9TdWJ0eXBlL0ltYWdlL0hlaWdodCAyMjUvRmlsdGVyL0RDVERlY29kZS9UeXBlL1hPYmplY3QvV2lkdGggMjI1L0JpdHNQZXJDb21wb25lbnQgOC9MZW5ndGggMTYyOTM+PnN0cmVhbQr/2P/gABBKRklGAAECAAABAAEAAP/wD165S80u2i8R3tgrukUYk8vvyFyAaztPsJtTu1toCgdhnMjbVA9zVxwWC5OeMbKye7Wj+Zf1PCyjzculrnqlp8S7JiA15NH/11jyPzrpbDxjbXmPLmt58/883wfyrwvU9Kn0q8FrM8UkuOkTbsex96hu7G70+VFuoHg jT3UoGRGvXAA6dun510YXmg1CD/dwVr931+S/M1o3i+WL9yK+9/5Bp2r3+kyiSzuGQd0PKN7Ef5NeleF/H0Vy6wyMLa5PWNjlH+h/ya5CO7azsU03WtBZ47eNijqhDBj3J6Y5/ka5fOGyuRg8c8irdKOI48N2VkYTcxZjVlMjIzODg1MDQyNTdkNDhlMjZiZWQwYTY+XS9Sb290IDIyIDAgUi9TaXplIDI0Pj4Kc3RhcnR4cmVmCjUyOTg2CiUlRU9GCg==');

DROP TABLE IF EXISTS `typedemande`;
CREATE TABLE `typedemande` (
  `CODE` int(11) NOT NULL,
  `LIBELLE` varchar(30) NOT NULL,
  `LIBELLEA` varchar(30) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

INSERT INTO `typedemande` (`CODE`, `LIBELLE`, `LIBELLEA`) VALUES
(0,	'---',	'---'),
(5,	'Durée insuffisante',	'المدة غير كافية'),
(1,	'Première demande',	'طلب أول'),
(2,	'Perte ou Détérioration',	'ضياع أو اتلاف'),
(3,	'Renouvellement',	'تجديد'),
(4,	'Correction',	'تصحيح'),
(6,	'Saturé',	'مملوء'),
(7,	'Autres motifs',	'اسباب أخرى');

DROP TABLE IF EXISTS `typedocument`;
CREATE TABLE `typedocument` (
  `CODE` int(11) NOT NULL,
  `LIBELLE` varchar(30) NOT NULL,
  `LIBELLEA` varchar(30) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

INSERT INTO `typedocument` (`CODE`, `LIBELLE`, `LIBELLEA`) VALUES
(5,	'Carte didentification',	'بطاقة هوية'),
(6,	'Passeport standard',	'جواز سفر عادي'),
(7,	'Passeport VIP',	'جواز سفر خاص'),
(8,	'Carte Résident',	'بطاقة إقامة');

-- 2023-10-12 12:16:14








