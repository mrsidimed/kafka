
package mr.anrpts.ordreRecette;

import java.util.Date;

--select * from certificat where sent=0
update certificat set sent = 0 where id_certificat=589 and id_certificat=1088

--SELECT  *  FROM    type_genre  WHERE type = 'VP' and nb_place_max >=4  and  nb_place_min <=4
--SELECT nom_complet_prop FROM properietaire WHERE nni = '3617753711'

/**
 *
 * @author Jemil Abdel Jelil
 */
public class ORCarteGrise {
    private String numero; //Numéro de l'ordre de recette : 'idcertificat/DTT/22' DTT:direction transport terrestre, 22 annee code sur deux chiffres  
    private String vin;  // le numero de chassis du veicule. veicule.chassis
    private String marque;  //table vihicule
    private String type;   //table vihicule
    private String genre; //libelle_genre de la table genre     NB: la table genre est lié avec la table vehicule colonne id_genre
    private String genre_type; //type de la table genre   pour faire le calcul du montant
    private String puissanceFiscal;//table vihicule
    private String matricule;  //table certificat colonne sequance_matricule

    private Long chargeUtile;  //poids_charge - poids_vide de la table vehicule
    private String nni;   //id_prop de la table certificat sinon champs id_etablissement inner join table etablissement sinon id_pays inner join avec la table pays
    private String proprietaire;  // nom_complet_prop de la table properietaire
    private Date dateGeneration;   //now
    private Date dateMutation; //  date_vente de la table certificat
    private Integer nombrePlaces;  //nbr_placs de la table vehicule

    private String cacAr = "إ ن ب"; /*Nom du centre d'accueil des citoyens en Arabe */  //fixe

    private String cacFr = "DTT"; /*Nom du centre d'accueil des citoyens en Français */  //fixe


    private Double montant;   //table genre-type 

    
    
    /*
    
    if(genre.type=="VP") NB: la table genre est lié avec la table vehicule colonne id_genre
    on cherche dans la table type_genre la lign dont la valeur du champ nb_place_min >=nombrePlaces et nb_place_max <=nombrePlaces et le type='VP'
    ===>x
    
    if(genre.type=="UT") NB: la table genre est lié avec la table vehicule colonne id_genre
    on cherche dans la table type_genre la ligne dont la valeur du champ poids_min >=chargeUtile et poids_max <=chargeUtile et le type='UT'
    ===>x
    
    
    if(genre.type=="TT") NB: la table genre est lié avec la table vehicule colonne id_genre
    on cherche dans la table type_genre la ligne dont le type='TT'
    ===>x
    
    
    if(TypeDemande="IMMATRICULATION")
    montant=x.immatriculation
    if( TypeDemande="MUTATION"){
    	if(now-dateMutation>3mois)
    	{
    	montant=x.mutation_hors_delai
    	}
    	else{
    	montant=x.mutation_dans_delai
    	}
    }
    if( TypeDemande="RENOUVELLEMENT CG")
     montant=x.remplacement
    if(TypeDemande="DUPLICATA")
    montant=x.duplicata
    
    */
    private String TypeDemande;   
    
    /*

      if(type_demande de la table certifiat == "CONVERSION")
      TypeDemande="RENOUVELLEMENT CG"
       if(type_demande de la table certifiat == "MUTATION" ||  "CONVERSION_MUTATION" )
      TypeDemande="MUTATION"
     if(type_demande de la table certifiat == "NOUVELLE" ||  "CONVERSION_REGIME" || "CONVERSION_BANALISE" )
      TypeDemande="IMMATRICULATION"
       if(type_demande de la table certifiat == "DUPLICATA" ||  "CONVERSION_DUPLICATA" || "CORRECTION" )
      TypeDemande="DUPLICATA"
    
    */


    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getVin() {
        return vin;
    }

    public void setVin(String vin) {
        this.vin = vin;
    }

    public String getMarque() {
        return marque;
    }

    public void setMarque(String marque) {
        this.marque = marque;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public String getPuissanceFiscal() {
        return puissanceFiscal;
    }

    public void setPuissanceFiscal(String puissanceFiscal) {
        this.puissanceFiscal = puissanceFiscal;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public Double getMontant() {
        return montant;
    }

    public void setMontant(Double montant) {
        this.montant = montant;
    }

   

    public Long getChargeUtile() {
        return chargeUtile;
    }

    public void setChargeUtile(Long chargeUtile) {
        this.chargeUtile = chargeUtile;
    }

    public String getNni() {
        return nni;
    }

    public void setNni(String nni) {
        this.nni = nni;
    }

    public String getProprietaire() {
        return proprietaire;
    }

    public void setProprietaire(String proprietaire) {
        this.proprietaire = proprietaire;
    }

    public Date getDateGeneration() {
        return dateGeneration;
    }

    public void setDateGeneration(Date dateGeneration) {
        this.dateGeneration = dateGeneration;
    }

    public Date getDateMutation() {
        return dateMutation;
    }

    public void setDateMutation(Date dateMutation) {
        this.dateMutation = dateMutation;
    }

    public Integer getNombrePlaces() {
        return nombrePlaces;
    }

    public void setNombrePlaces(Integer nombrePlaces) {
        this.nombrePlaces = nombrePlaces;
    }

    public String getTypeDemande() {
        return TypeDemande;
    }

    public void setTypeDemande(String TypeDemande) {
        this.TypeDemande = TypeDemande;
    }

    public String getCacAr() {
        return cacAr;
    }

    public void setCacAr(String cacAr) {
        this.cacAr = cacAr;
    }

    public String getCacFr() {
        return cacFr;
    }

    public void setCacFr(String cacFr) {
        this.cacFr = cacFr;
    }

}
