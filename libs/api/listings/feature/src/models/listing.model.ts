// eslint-disable-next-line
/// <reference types="@types/google.maps" />
import { AggregateRoot } from '@nestjs/cqrs';
import { 
  ListingEditedEvent, 
  Listing, 
  ApprovalChange, 
  StatusChangedEvent, 
  ChangeStatusResponse, 
  areaScore, 
  ChangeStatusRequest 
} from '@properproperty/api/listings/util';

export class ListingModel extends AggregateRoot implements Listing {
  constructor(
    public user_id: string,
    public address: string,
    public district: string,
    public price: number,
    public pos_type: string,
    public env_type: string,
    public prop_type: string,
    public furnish_type: string,
    public orientation: string,
    public floor_size: number,
    public property_size: number,
    public bath: number,
    public bed: number,
    public parking: number,
    public features: string[],
    public photos: string[],
    public desc: string,
    public let_sell: string,
    public listingAreaType: string,
    public heading: string,
    public approved: boolean,
    public listingDate: string,
    public geometry: {
      lat: number,
      lng: number
    },
    public pointsOfInterest: google.maps.places.PlaceResult[],
    public areaScore: areaScore,
    public listing_id?: string,
    public approvalChanges?: ApprovalChange[],
    public quality_rating?: number,
  ) {
    super();
  }

  static createListing(listing: Listing) {
    const model = new ListingModel(
      listing.user_id,
      listing.address,
      listing.district,
      listing.price,
      listing.pos_type,
      listing.env_type,
      listing.prop_type,
      listing.furnish_type,
      listing.orientation,
      listing.floor_size,
      listing.property_size,
      listing.bath,
      listing.bed,
      listing.parking,
      listing.features,
      listing.photos,
      listing.desc,
      listing.let_sell,
      listing.listingAreaType,
      listing.heading,
      listing.approved,
      listing.listingDate,
      listing.geometry,
      listing.pointsOfInterest,
      listing.areaScore,
      listing.listing_id,
      listing.approvalChanges,
      listing.quality_rating,
    );
    return model;
  }

  editListing(listing: Listing) {
    this.user_id = listing.user_id;
    this.address = listing.address;
    this.district = listing.district;
    this.price = listing.price;
    this.pos_type = listing.pos_type;
    this.env_type = listing.env_type;
    this.prop_type = listing.prop_type;
    this.furnish_type = listing.furnish_type;
    this.orientation = listing.orientation;
    this.floor_size = listing.floor_size;
    this.property_size = listing.property_size;
    this.bath = listing.bath;
    this.bed = listing.bed;
    this.parking = listing.parking;
    this.features = listing.features;
    this.photos = listing.photos;
    this.desc = listing.desc;
    this.let_sell = listing.let_sell;
    this.listingAreaType = listing.listingAreaType;
    this.heading = listing.heading;
    this.approved = listing.approved;
    this.listingDate = listing.listingDate;
    this.geometry = listing.geometry;
    this.pointsOfInterest = listing.pointsOfInterest;
    this.listing_id = listing.listing_id;
    this.quality_rating = listing.quality_rating;
    this.approvalChanges = listing.approvalChanges ?? [];
    this.approvalChanges.push({
      adminId: 'SYSTEM',
      status: false,
      date: new Date().toISOString(),
    });
    this.apply(new ListingEditedEvent(listing));
  }

  changeStatus(req: ChangeStatusRequest): ChangeStatusResponse {
    this.approved = !this.approved;
    const change: ApprovalChange = {
      adminId: req.adminId,
      status: this.approved,
      date: new Date().toISOString(),
    };
    console.log(change);
    this.approvalChanges = this.approvalChanges ?? [];
    this.approvalChanges.push(change);
    if (!this.listing_id) {
      throw new Error('yeah idk fam. this should never happen. the listing has no listing_id');
    }
    this.apply(new StatusChangedEvent(this.listing_id, change, this.user_id, req));

    return {success: true, approvalChange: change};
  }

  toJSON(): Listing {
    return {
      user_id: this.user_id,
      address: this.address,
      district: this.district,
      price: this.price,
      pos_type: this.pos_type,
      env_type: this.env_type,
      prop_type: this.prop_type,
      furnish_type: this.furnish_type,
      orientation: this.orientation,
      floor_size: this.floor_size,
      property_size: this.property_size,
      bath: this.bath,
      bed: this.bed,
      parking: this.parking,
      features: this.features,
      photos: this.photos,
      desc: this.desc,
      let_sell: this.let_sell,
      heading: this.heading,
      approved: this.approved,
      listingDate: this.listingDate,
      areaScore: this.areaScore,
      listing_id: this.listing_id,
      approvalChanges: this.approvalChanges,
      quality_rating: this.quality_rating,
      listingAreaType: this.listingAreaType,
      geometry: this.geometry,
      pointsOfInterest: this.pointsOfInterest,
    };
  }
}