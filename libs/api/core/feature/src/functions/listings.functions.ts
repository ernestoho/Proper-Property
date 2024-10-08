import * as functions from 'firebase-functions';
import { 
  ChangeStatusRequest, ChangeStatusResponse,
  CreateListingRequest, CreateListingResponse,
  GetApprovedListingsResponse, GetListingsRequest,
  GetListingsResponse,
  EditListingRequest, EditListingResponse, GetUnapprovedListingsResponse, GetFilteredListingsRequest, GetFilteredListingsResponse} from '@properproperty/api/listings/util';
import { NestFactory } from '@nestjs/core';
import { CoreModule } from '../core.module';
import { ListingsService } from '@properproperty/api/listings/feature';


export const getListings = functions.region('europe-west1').https.onCall(
  async(
    request: GetListingsRequest
  ): Promise<GetListingsResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule)
    const listingService = appContext.get(ListingsService);
    return listingService.getListings(request);
  }
);

export const createListing = functions.region('europe-west1').https.onCall(
  async(
    request: CreateListingRequest
  ): Promise<CreateListingResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule)
    const listingService = appContext.get(ListingsService);

    return listingService.createListing(request);
  }
);

export const changeStatus = functions.region('europe-west1').https.onCall(
  async(
    request: ChangeStatusRequest
  ): Promise<ChangeStatusResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule);
    const listingService = appContext.get(ListingsService);

    return listingService.changeStatus(request);
  }
);

export const getApprovedListings = functions.region('europe-west1').https.onCall(
  async(
  ): Promise<GetApprovedListingsResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule)
    const listingService = appContext.get(ListingsService);
    return listingService.getApprovedListings();
  }
);

export const getUnapprovedListings = functions.region('europe-west1').https.onCall(
  async(
  ):Promise<GetUnapprovedListingsResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule)
    const listingService = appContext.get(ListingsService);
    return listingService.getUnapprovedListings();
  }
)

export const editListing = functions.region('europe-west1').https.onCall(
  async(
    request: EditListingRequest
  ): Promise<EditListingResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule)
    const listingService = appContext.get(ListingsService);
    return listingService.editListing(request); 
  }
);

export const saveListing = functions.region('europe-west1').https.onCall(
  async(
    request: CreateListingRequest
  ): Promise<CreateListingResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule)
    const listingService = appContext.get(ListingsService);
    return listingService.saveListing(request); 
  }
);

export const filterListings = functions.region('europe-west1').https.onCall(
  async(
    request: GetFilteredListingsRequest,
  ): Promise<GetFilteredListingsResponse> => {
    const appContext = await NestFactory.createApplicationContext(CoreModule)
    const listingService = appContext.get(ListingsService);
    return listingService.filterListings(request);
  }
);  
  