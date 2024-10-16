import * as admin from 'firebase-admin';
import { DocumentSnapshot, FieldValue } from 'firebase-admin/firestore';
import { Injectable } from '@nestjs/common';
import { GetListingsRequest,
  Listing,
  CreateListingResponse,
  ChangeStatusRequest,
  ChangeStatusResponse,
  GetListingsResponse, 
  GetApprovedListingsResponse,
  EditListingResponse,
  StatusChange,
  GetUnapprovedListingsResponse,
  StatusEnum,
  GetFilteredListingsRequest,
  GetFilteredListingsResponse,
  RentSell
} from '@properproperty/api/listings/util';
@Injectable()
export class ListingsRepository {

  async getListing(listingId: string): Promise<GetListingsResponse>{
    const doc = await admin
      .firestore()
      .collection('listings')
      .doc(listingId)
      .get();
    const data = doc.data();
    if(data){
      return {listings: [data as Listing]};
    }
    else{
      return {listings: []};
    }
  }

  async getListings(req: GetListingsRequest): Promise<GetListingsResponse>{
    const collection = admin.firestore().collection('listings');
    let query: admin.firestore.Query;

    if(req.userId){
      query = collection.where('user_id', '==', req.userId);
    }
    else{
      query = collection.limit(10);
    }

    const listings: Listing [] = [];
    (await query.get()).forEach((doc) => {
      listings.push(doc.data() as Listing);
    });

    return {listings: listings};
  }

  async createListing(listing : Listing): Promise<CreateListingResponse>{
    // the guy she tells you not to worry about
    // return admin
    //   .firestore()
    //   .collection('listings')
    //   .withConverter<Listing>({
    //     fromFirestore: (snapshot) => snapshot.data() as Listing,
    //     toFirestore: (listing: Listing) => listing
    //   })
    //   // Won't work... unless?
    //   .add({
    //     listing_id: FieldPath.documentId().toString(),
    //     ...listing
    //   })
    //   .then((docRef) => {
    //     return {
    //       status: true,
    //       message: docRef.id
    //     };
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     return {
    //       status: false,
    //       message: error.message
    //     }
    //   });

    // you
    const listingRef = admin
      .firestore()
      .collection('listings')
      .withConverter<Listing>({
        fromFirestore: (snapshot) => snapshot.data() as Listing,
        toFirestore: (listing: Listing) => listing
      })
      .doc();
    
    listing.listing_id = listingRef.id;
    return listingRef.set(listing)
      .then(() => {
        return {
          status: true,
          message: listingRef.id
        };
      })
      .catch((error) => {
        return {
          status: false,
          message: error.message
        }
    });
  }

  async saveListing(listing : Listing){
    if(listing.listing_id){
      await admin
      .firestore()
      .collection('listings')
      .doc(listing.listing_id)
      .set(listing);

      return {status: true, message: listing.listing_id};
    }
    
    return {status: false, message: "FAILURE"};
  }

  async changeStatus(listingId: string, change: StatusChange, req : ChangeStatusRequest): Promise<ChangeStatusResponse>{
    try {
      if (!req.crimeScore || !req.waterScore || !req.sanitationScore || !req.schoolScore) {
        await admin
          .firestore()
          .collection('listings')
          .doc(listingId)
          .update({
            statusChanges: FieldValue.arrayUnion(change),
            status: req.status
          });
      }
      else {
        await admin
          .firestore()
          .collection('listings')
          .doc(listingId)
          .update({
            statusChanges: FieldValue.arrayUnion(change),
            status: req.status,
            areaScore: {
              crimeScore: req.crimeScore ?? 0,
              waterScore: req.waterScore ?? 0,
              sanitationScore: req.sanitationScore ?? 0,
              schoolScore: req.schoolScore ?? 0
            }
          });
      }

    } catch(error: any) {
      return {
        success: false,
        statusChange: undefined,
        message: error.message
      }
    }

    return {
      success: true,
      statusChange: change
    };
  }

  async getApprovedListings(): Promise<GetApprovedListingsResponse>{
    const query = admin
    .firestore()
    .collection('listings').where("status", "==", StatusEnum.ON_MARKET);
    
    const listings : Listing[] = [];
    (await query.get()).docs.map((doc) => {
      doc.data() as Listing;
      listings.push(doc.data() as Listing);
    })

    return {approvedListings : listings};
  }

  async editListing(listing : Listing) : Promise<EditListingResponse>{
    if(listing.listing_id){
      await admin
      .firestore()
      .collection('listings')
      .doc(listing.listing_id)
      .set(listing, {merge: true});

      return {listingId : listing.listing_id};
    }

    return {listingId : "FAILIRE"}
  }

  async getUnapprovedListings(): Promise<GetUnapprovedListingsResponse>{
    const query = admin
    .firestore()
    .collection('listings')
    .where("status", "in", [StatusEnum.PENDING_APPROVAL, StatusEnum.EDITED]);
    
    const listings : Listing[] = [];
    (await query.get()).docs.forEach((doc) => {
      doc.data() as Listing;
      listings.push(doc.data() as Listing);
    })

    return {unapprovedListings : listings};
  }
  pageSize = 10;
  async getFilteredListings(req: GetFilteredListingsRequest): Promise<GetFilteredListingsResponse>{
    try{
      const listingsCollection = admin.firestore().collection('listings');
      let query = listingsCollection
        .withConverter<Listing>({
          fromFirestore: (snapshot) => snapshot.data() as Listing,
          toFirestore: (listing: Listing) => listing
        })
        .where('status', '==', StatusEnum.ON_MARKET)
        .orderBy('quality_rating')

      let lastListingDoc: DocumentSnapshot | undefined = undefined;
      if (req.lastListingId) {
        lastListingDoc = (await listingsCollection
          .doc(req.lastListingId)
          .get());
      }

      if(req.prop_type){
        query = query.where("prop_type", "==", req.prop_type);
      }

      if(req.features){
        query = query.where("features", "array-contains-any", req.features);
      }
      if (req.let_sell && req.let_sell != RentSell.ANY) {
        query = query.where("let_sell", "==", req.let_sell);
      }
      if(req.env_type){
        query = query.where("env_type", "==", req.env_type);
      }
      const response: GetFilteredListingsResponse = {
        status: true,
        listings: []
      }
      
      if (lastListingDoc?.exists) {
        query = query.startAfter(lastListingDoc).limit(this.pageSize);
      }
      let loopLimit = 0;
      // let lastListing: Listing | undefined = undefined;
      // let lastQualityRating = 0;
      let lastSnapshot: DocumentSnapshot | undefined = undefined
      // console.log(req);
      while (response.listings.length < 10 && loopLimit < 25) {
        const queryData = await query.get();
        ++loopLimit;
        // queryData.forEach((docSnapshot) => {
        for(const docSnapshot of queryData.docs){
          const data = docSnapshot.data();
          lastSnapshot = docSnapshot;
          if (!data.geometry || !req.addressViewport) {
            continue;
          }
          if(data.geometry.lat > req.addressViewport.ne.lat || data.geometry.lat < req.addressViewport.sw.lat
          || data.geometry.lng > req.addressViewport.ne.lng || data.geometry.lng < req.addressViewport.sw.lng) {
            continue;
          }
          if (req.bath && parseInt("" + data.bath) < parseInt("" + req.bath)) {
            continue;
          }
          if (req.bed && parseInt("" + data.bed) < parseInt("" + req.bed)) {
            continue;
          }
          if (req.parking && parseInt("" + data.parking) < parseInt("" + req.parking)) {
            continue;
          }
          if ((req.price_min && parseInt("" + data.price) < parseInt("" + req.price_min)) ) {
            continue;
          }
          if ((req.price_max && parseInt("" + data.price) > parseInt("" + req.price_max))) {
            continue;
          }
          if ((req.property_size_min && parseInt("" + data.property_size) < parseInt("" + req.property_size_min) ) ) {
            continue;
          }
          if ((req.property_size_max && parseInt("" + data.property_size) > parseInt("" + req.property_size_max) )) {
            continue;
          }
          if ((req.areaScore?.crimeScore && parseFloat("" + data.areaScore.crimeScore) < parseFloat("" + req.areaScore.crimeScore))) {
            continue;
          }
          if ((req.areaScore?.waterScore && parseFloat("" + data.areaScore.waterScore) < parseFloat("" + req.areaScore.waterScore))) {
            continue;
          }
          if ((req.areaScore?.schoolScore && parseFloat("" + data.areaScore.schoolScore) < parseFloat("" + req.areaScore.schoolScore))) {
            continue;
          }
          if ((req.areaScore?.sanitationScore && parseFloat("" + data.areaScore.sanitationScore) < parseFloat("" + req.areaScore.sanitationScore))) {
            continue;
          }
          if ((req.totalAreaScore && (parseFloat("" + data.areaScore.waterScore) + parseFloat("" + data.areaScore.schoolScore) + parseFloat("" + data.areaScore.crimeScore) + parseFloat("" + data.areaScore.sanitationScore))/4 < parseFloat("" + req.totalAreaScore))) {
            continue;
          }

          response.listings.push(data);
          if(response.listings.length >= this.pageSize){
            return response;
          }
        }
        if (lastSnapshot)
          query = query.startAfter(lastSnapshot).limit(this.pageSize - response.listings.length);
      }
      return response;
    }
    catch(e: any){
      return {status: false, listings: [], error: e.message}
    }
  }
}