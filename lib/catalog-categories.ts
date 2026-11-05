export const catalogCategories = {
  headlights: {
    label: "Headlights",
    title: "Headlight assemblies",
    summary: "Replacement and retrofit lighting. Check the vehicle, original lamp type and connector before ordering.",
    checklist: [
      ["Vehicle & market", "Confirm the model, trim, year and left- or right-hand drive."],
      ["Original equipment", "Match the original lamp type, plug and OE reference where available."],
      ["Lighting & coding", "Review DRL, leveling, adaptive functions and any coding requirements."],
    ],
  },
  "tail-lights": {
    label: "Tail lights",
    title: "Tail light assemblies",
    summary: "Browse rear lamps by vehicle. Confirm body style, side and plug before requesting a quote.",
    checklist: [
      ["Body style", "Sedan, coupe, wagon and facelift variants can use different housings."],
      ["Side & position", "Confirm left or right, inner or outer, single lamp or full set."],
      ["Lens & connector", "Check the lens style, pin count and signal configuration."],
    ],
  },
  exhaust: {
    label: "Exhaust systems",
    title: "Performance exhaust systems",
    summary: "Compare cat-back, axle-back and downpipe listings by vehicle, engine and material.",
    checklist: [
      ["Engine & drivetrain", "Check the engine code, drivetrain and existing exhaust layout."],
      ["System section", "Confirm the section, material, valve options and included hardware."],
      ["Use & destination", "Confirm installation and local road-use requirements before ordering."],
    ],
  },
  wheels: {
    label: "Forged wheels",
    title: "Forged wheels",
    summary: "Compare wheel designs by maker and model. Confirm dimensions and finish for your application.",
    checklist: [
      ["Wheel size & clearance", "Confirm diameter, width and brake clearance for the vehicle."],
      ["PCD, offset & bore", "Confirm the bolt pattern, mounting offset and hub diameter."],
      ["Load & finish", "Verify required load rating, finish, caps and hardware by quote."],
    ],
  },
  "body-kits": {
    label: "Body kit sourcing",
    title: "Body kits & exterior parts",
    summary: "Request parts by vehicle and body style. We review the components, finish and shipping requirements before quotation.",
    checklist: [
      ["Vehicle & mounting", "Confirm year, trim, body style and bumper version."],
      ["Components & finish", "Review material, included parts, mounting hardware and paint requirements."],
      ["Packing & freight", "Confirm protection, carton size and destination for oversized parts."],
    ],
  },
} as const;

export type CatalogCategory = keyof typeof catalogCategories;
