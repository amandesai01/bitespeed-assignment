import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateContactDTO } from './create-contact.dto';
import { DataSource } from 'typeorm';
import { ContactEntity } from './contact.entity';
import { LinkPrecedence } from './link-precendence.enum';

@Injectable()
export class AppService {
  private readonly logger: Logger = new Logger(AppService.name);

  constructor(private readonly datasource: DataSource) {}

  async identify(createContactDTO: CreateContactDTO) {
    const contactEntityRepository = this.datasource.createEntityManager().getRepository(ContactEntity);

    const query = [];

    if (createContactDTO.email) {
      query.push({ email: createContactDTO.email });
    }

    if (createContactDTO.phoneNumber) {
      query.push({ phoneNumber: createContactDTO.phoneNumber });
    }

    if (query.length == 0) {
      throw new BadRequestException('Atleast one of `email` or `phoneNumber` required');
    }

    const existingContacts = await contactEntityRepository.find({
      where: query,
    });

    const contactsToSave = [...existingContacts];

    if (existingContacts.length > 0) {
      const primaryContacts = existingContacts.filter((c) => LinkPrecedence.isPrimary(c.linkPrecedence));

      if (primaryContacts.length == 2) {
        // This indicates that one contact has email and other has number
        const firstPrimaryContact = primaryContacts[0];
        const secondPrimaryContact = primaryContacts[1];

        secondPrimaryContact.linkPrecedence = LinkPrecedence.SECONDARY.getId();
        secondPrimaryContact.linkedId = firstPrimaryContact.id;
      } else if (primaryContacts.length == 1) {
        let primaryContact = primaryContacts[0];

        const otherSecondaryContactsWithDifferentPrimaryContacts = existingContacts
          .filter((c) => LinkPrecedence.isSecondary(c.linkPrecedence))
          .filter((c) => c.linkedId != primaryContact.id);

        if (otherSecondaryContactsWithDifferentPrimaryContacts.length != 0) {
          const otherSecondaryContactsWithDifferentPrimaryContact = otherSecondaryContactsWithDifferentPrimaryContacts[0];
          primaryContact.linkPrecedence = LinkPrecedence.SECONDARY.getId();
          primaryContact.linkedId = otherSecondaryContactsWithDifferentPrimaryContact.linkedId;
        } else {
          this.mergeWithPrimaryContact(primaryContact, existingContacts, createContactDTO, contactsToSave);
        }
      } else if (primaryContacts.length == 0) {
        // This indicates only secondary contacts found.
        const secondaryContact = existingContacts[0];
        const primaryContact = await contactEntityRepository.findOne({ where: { id: secondaryContact.linkedId } });
        if (!primaryContact) {
          this.logger.error('Primary contact not found for secondary contact');
          throw new InternalServerErrorException('Error #00');
        }
        contactsToSave.push(primaryContact);
        existingContacts.push(primaryContact);
        this.mergeWithPrimaryContact(primaryContact, existingContacts, createContactDTO, contactsToSave);
      } else {
        this.logger.error('Invalid size of primary contact list.');
        throw new InternalServerErrorException('Error #01');
      }
    } else {
      contactsToSave.push(this.makeNewContact(createContactDTO));
    }

    const savedContacts = await contactEntityRepository.save(contactsToSave);

    const primaryContacts = savedContacts.filter((c) => LinkPrecedence.isPrimary(c.linkPrecedence));
    const secondaryContacts = savedContacts.filter((c) => LinkPrecedence.isSecondary(c.linkPrecedence));

    if (primaryContacts.length > 1) {
      this.logger.error('Invalid number of primary contacts after saving: ' + primaryContacts.length);
      throw new InternalServerErrorException('Error #10');
    }

    let primaryContact: ContactEntity;
    if (primaryContacts.length == 0 && secondaryContacts.length > 0) {
      primaryContact = await contactEntityRepository.findOne({ where: { id: secondaryContacts[0].linkedId } });
    } else {
      primaryContact = primaryContacts[0];
    }

    const emails = secondaryContacts.filter((c) => !!c.email).map((c) => c.email);
    if (primaryContact.email) {
      emails.unshift(primaryContact.email);
    }

    const phoneNumbers = secondaryContacts.filter((c) => !!c.phoneNumber).map((c) => c.phoneNumber);
    if (primaryContact.phoneNumber) {
      phoneNumbers.unshift(primaryContact.phoneNumber);
    }

    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: [...secondaryContacts.map((c) => c.id)],
      },
    };
  }

  private mergeWithPrimaryContact(
    primaryContact: ContactEntity,
    existingContacts: ContactEntity[],
    createContactDTO: CreateContactDTO,
    contactsToSave: ContactEntity[],
  ) {
    const isEmailAlreadySaved = !!existingContacts.find((c) => c.email && c.email == createContactDTO.email);
    const isNumberAlreadySaved = !!existingContacts.find((c) => c.phoneNumber && c.phoneNumber == createContactDTO.phoneNumber);

    if (isEmailAlreadySaved && isNumberAlreadySaved) {
      // No need to save.
    } else if (!isNumberAlreadySaved && createContactDTO.phoneNumber) {
      const contactWithoutNumber = existingContacts.find((c) => !c.phoneNumber);
      if (contactWithoutNumber) {
        contactWithoutNumber.phoneNumber = createContactDTO.phoneNumber;
      } else {
        const newContact = this.makeNewContact(createContactDTO, primaryContact.id);
        delete newContact.email; // Delete email since it is already saved, leaving room if new one comes.
        contactsToSave.push(newContact);
      }
    } else if (!isEmailAlreadySaved && createContactDTO.email) {
      const contactWithoutEmail = existingContacts.find((c) => !c.email);
      if (contactWithoutEmail) {
        contactWithoutEmail.email = createContactDTO.email;
      } else {
        const newContact = this.makeNewContact(createContactDTO, primaryContact.id);
        delete newContact.phoneNumber; // Delete phoneno since it is already saved, leaving room if new one comes.
        contactsToSave.push(newContact);
      }
    }
  }

  private makeNewContact(createContactDTO: CreateContactDTO, primaryContactId: number = -1): ContactEntity {
    const contactEntityRepository = this.datasource.createEntityManager().getRepository(ContactEntity);

    const newContact = contactEntityRepository.create();
    newContact.email = createContactDTO.email;
    newContact.phoneNumber = createContactDTO.phoneNumber;

    if (primaryContactId != -1) {
      newContact.linkedId = primaryContactId;
      newContact.linkPrecedence = LinkPrecedence.SECONDARY.getId();
    } else {
      newContact.linkPrecedence = LinkPrecedence.PRIMARY.getId();
    }

    return newContact;
  }
}
