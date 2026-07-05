import { TemplatesController } from "./templates.controller";
import { TemplatesService } from "./templates.service";

describe("TemplatesController", () => {
  let controller: TemplatesController;
  let service: TemplatesService;

  beforeEach(() => {
    service = new TemplatesService();
    service.onModuleInit();
    controller = new TemplatesController(service);
  });

  it("findAll delegates to the service", () => {
    expect(controller.findAll()).toEqual(service.listDocumentTypes());
  });

  it("findOne delegates to the service with the given id", () => {
    expect(controller.findOne("mutual-nda")).toEqual(service.getDocumentType("mutual-nda"));
  });
});
